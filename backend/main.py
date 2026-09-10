from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, HTTPException, File, Form, UploadFile, Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import db
from models import (
    ReportStatusUpdate,
    UserRegister,
    UserLogin,
    UserProfileUpdate,
    ReportAssignment,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET_KEY,
    ALGORITHM,
)
from jose import JWTError, jwt
from bson import ObjectId

app = FastAPI()

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )

    user = db.users.find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

def get_current_admin(
    current_user = Security(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user

@app.get("/")
def root():
    return {"message": "Smart Civic API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-health")
def database_health():
    db.command("ping")

    return {
        "status": "ok",
        "database": "connected"
    }

@app.post("/register")
def register_user(user: UserRegister):
    existing_user = db.users.find_one({
        "email": user.email.lower()
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    now = datetime.now(timezone.utc)

    user_data = {
        "name": user.name.strip(),
        "email": user.email.lower().strip(),
        "password_hash": hash_password(user.password),
        "role": "citizen",
        "created_at": now,
    }

    result = db.users.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
        "role": "citizen"
    }

@app.post("/reports")
def create_report(
    category: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    photo: UploadFile = File(...),
    current_user = Security(get_current_user)
):
    # Make sure only image files are accepted
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image"
        )

    # Preserve the original file extension
    file_extension = Path(photo.filename or "").suffix.lower()

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    }

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format"
        )

    # Give every uploaded image a unique name
    unique_filename = f"{uuid4()}{file_extension}"

    file_path = UPLOAD_DIR / unique_filename

    # Save image inside backend/uploads/
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    now = datetime.now(timezone.utc)

    report_data = {
        "user_id": str(current_user["_id"]),
        "category": category,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "address": address,
        "photo_url": f"/uploads/{unique_filename}",
        "status": "reported",
        "created_at": now,
        "updated_at": now,
    }

    result = db.reports.insert_one(report_data)

    return {
        "message": "Report created successfully",
        "report_id": str(result.inserted_id),
        "status": "reported",
        "photo_url": f"/uploads/{unique_filename}"
    }

@app.get("/reports")
def get_reports(
    current_admin = Security(get_current_admin)
):
    reports = []

    for report in db.reports.find():
        report["_id"] = str(report["_id"])
        reports.append(report)

    return reports

@app.get("/my-reports")
def get_my_reports(
    current_user = Security(get_current_user)
):
    reports = []

    for report in db.reports.find({
        "user_id": str(current_user["_id"])
    }).sort("created_at", -1):
        report["_id"] = str(report["_id"])
        reports.append(report)

    return reports

@app.get("/reports/{report_id}")
def get_report(
    report_id: str,
    current_admin = Security(get_current_admin)
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID"
        )

    report = db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    report["_id"] = str(report["_id"])

    return report

@app.patch("/reports/{report_id}/status")
def update_report_status(
    report_id: str,
    status_update: ReportStatusUpdate,
    current_admin = Security(get_current_admin)
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID"
        )

    allowed_statuses = [
        "reported",
        "assigned",
        "in_progress",
        "resolved"
    ]

    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid report status"
        )

    result = db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return {
        "message": "Report status updated successfully",
        "status": status_update.status
    }

@app.patch("/reports/{report_id}/assign")
def assign_report(
    report_id: str,
    assignment: ReportAssignment,
    current_admin = Security(get_current_admin)
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID"
        )

    department = assignment.department.strip()
    assigned_to = assignment.assigned_to.strip()

    if not department:
        raise HTTPException(
            status_code=400,
            detail="Department cannot be empty"
        )

    if not assigned_to:
        raise HTTPException(
            status_code=400,
            detail="Assigned officer cannot be empty"
        )

    result = db.reports.update_one(
        {
            "_id": ObjectId(report_id)
        },
        {
            "$set": {
                "department": department,
                "assigned_to": assigned_to,
                "assigned_at": datetime.now(
                    timezone.utc
                ),
                "status": "assigned",
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    updated_report = db.reports.find_one({
        "_id": ObjectId(report_id)
    })

    updated_report["_id"] = str(
        updated_report["_id"]
    )

    return {
        "message": "Report assigned successfully",
        "report": updated_report
    }

@app.post("/login")
def login_user(user: UserLogin):
    existing_user = db.users.find_one({
        "email": user.email.lower().strip()
    })

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": str(existing_user["_id"]),
        "role": existing_user["role"]
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
            "role": existing_user["role"]
        }
    }

@app.get("/me")
def get_me(
   current_user = Security(get_current_user)
):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@app.patch("/me")
def update_me(
    profile_update: UserProfileUpdate,
    current_user = Security(get_current_user)
):
    name = profile_update.name.strip()
    email = profile_update.email.lower().strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty"
        )

    existing_email_user = db.users.find_one({
        "email": email,
        "_id": {
            "$ne": current_user["_id"]
        }
    })

    if existing_email_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    db.users.update_one(
        {
            "_id": current_user["_id"]
        },
        {
            "$set": {
                "name": name,
                "email": email,
                "updated_at": datetime.now(
                    timezone.utc
                )
            }
        }
    )

    updated_user = db.users.find_one({
        "_id": current_user["_id"]
    })

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user["role"]
        }
    }

