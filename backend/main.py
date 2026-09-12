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
    DepartmentCreate,
    OfficerCreate,
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

def get_current_officer(
    current_user = Security(get_current_user)
):
    if current_user.get("role") != "officer":
        raise HTTPException(
            status_code=403,
            detail="Officer access required"
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

    if not ObjectId.is_valid(
        assignment.department_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid department ID"
        )

    if not ObjectId.is_valid(
        assignment.officer_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid officer ID"
        )

    department = db.departments.find_one({
        "_id": ObjectId(
            assignment.department_id
        )
    })

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    officer = db.officers.find_one({
        "_id": ObjectId(
            assignment.officer_id
        )
    })

    if not officer:
        raise HTTPException(
            status_code=404,
            detail="Officer not found"
        )

    if (
        officer["department_id"]
        != assignment.department_id
    ):
        raise HTTPException(
            status_code=400,
            detail=
                "Officer does not belong to selected department"
        )

    now = datetime.now(timezone.utc)

    result = db.reports.update_one(
        {
            "_id": ObjectId(report_id)
        },
        {
            "$set": {
                "department_id":
                    assignment.department_id,

                "department":
                    department["name"],

                "assigned_officer_id":
                    assignment.officer_id,

                "assigned_to":
                    officer["name"],

                "assigned_at": now,

                "status": "assigned",

                "updated_at": now,
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
        "message":
            "Report assigned successfully",
        "report": updated_report
    }

@app.get("/officer/reports")
def get_officer_reports(
    current_officer =
        Security(get_current_officer)
):
    officer_id = current_officer.get(
        "officer_id"
    )

    if not officer_id:
        raise HTTPException(
            status_code=400,
            detail=
                "Officer account is not linked correctly"
        )

    reports = []

    for report in db.reports.find({
        "assigned_officer_id":
            officer_id
    }).sort("created_at", -1):

        report["_id"] = str(
            report["_id"]
        )

        reports.append(report)

    return reports

@app.patch("/officer/reports/{report_id}/status")
def update_officer_report_status(
    report_id: str,
    status_update: ReportStatusUpdate,
    current_officer = Security(get_current_officer)
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID"
        )

    officer_id = current_officer.get(
        "officer_id"
    )

    if not officer_id:
        raise HTTPException(
            status_code=400,
            detail="Officer account is not linked correctly"
        )

    report = db.reports.find_one({
        "_id": ObjectId(report_id),
        "assigned_officer_id": officer_id
    })

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Assigned report not found"
        )

    current_status = report.get(
        "status"
    )

    allowed_transitions = {
        "assigned": "in_progress",
        "in_progress": "resolved"
    }

    next_status = allowed_transitions.get(
        current_status
    )

    if not next_status:
        raise HTTPException(
            status_code=400,
            detail="This report cannot be updated further"
        )

    if status_update.status != next_status:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Status must change from "
                f"{current_status} to "
                f"{next_status}"
            )
        )

    now = datetime.now(
        timezone.utc
    )

    update_data = {
        "status": status_update.status,
        "updated_at": now
    }

    if status_update.status == "in_progress":
        update_data[
            "work_started_at"
        ] = now

    if status_update.status == "resolved":
        update_data[
            "resolved_at"
        ] = now

    db.reports.update_one(
        {
            "_id": ObjectId(report_id),
            "assigned_officer_id":
                officer_id
        },
        {
            "$set": update_data
        }
    )

    return {
        "message":
            "Report status updated successfully",
        "status":
            status_update.status
    }

@app.post("/departments")
def create_department(
    department: DepartmentCreate,
    current_admin = Security(get_current_admin)
):
    name = department.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Department name cannot be empty"
        )

    existing_department = db.departments.find_one({
        "name": {
            "$regex": f"^{name}$",
            "$options": "i"
        }
    })

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    department_data = {
        "name": name,
        "created_at": datetime.now(
            timezone.utc
        ),
    }

    result = db.departments.insert_one(
        department_data
    )

    return {
        "message": "Department created successfully",
        "department": {
            "id": str(result.inserted_id),
            "name": name,
        }
    }


@app.get("/departments")
def get_departments(
    current_admin = Security(get_current_admin)
):
    departments = []

    for department in db.departments.find().sort(
        "name",
        1
    ):
        departments.append({
            "id": str(department["_id"]),
            "name": department["name"],
        })

    return departments

@app.post("/officers")
def create_officer(
    officer: OfficerCreate,
    current_admin = Security(get_current_admin)
):
    name = officer.name.strip()
    email = officer.email.lower().strip()
    password = officer.password
    department_id = officer.department_id.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Officer name cannot be empty"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Officer email cannot be empty"
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Officer password cannot be empty"
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Officer password must be at least 6 characters"
        )

    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid department ID"
        )

    department = db.departments.find_one({
        "_id": ObjectId(department_id)
    })

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    existing_officer = db.officers.find_one({
        "email": email
    })

    if existing_officer:
        raise HTTPException(
            status_code=400,
            detail="Officer email already exists"
        )

    existing_user = db.users.find_one({
        "email": email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered as a user"
        )

    now = datetime.now(timezone.utc)

    # First create officer record
    officer_data = {
        "name": name,
        "email": email,
        "department_id": department_id,
        "created_at": now,
    }

    officer_result = db.officers.insert_one(
        officer_data
    )

    officer_id = str(
        officer_result.inserted_id
    )

    # Create login account for officer
    user_data = {
        "name": name,
        "email": email,
        "password_hash": hash_password(
            password
        ),
        "role": "officer",
        "officer_id": officer_id,
        "department_id": department_id,
        "created_at": now,
    }

    user_result = db.users.insert_one(
        user_data
    )

    # Link officer record back to user account
    db.officers.update_one(
        {
            "_id": officer_result.inserted_id
        },
        {
            "$set": {
                "user_id": str(
                    user_result.inserted_id
                )
            }
        }
    )

    return {
        "message":
            "Officer created successfully",

        "officer": {
            "id": officer_id,
            "user_id": str(
                user_result.inserted_id
            ),
            "name": name,
            "email": email,
            "department_id":
                department_id,
            "department_name":
                department["name"],
            "role": "officer"
        }
    }

@app.get("/departments/{department_id}/officers")
def get_department_officers(
    department_id: str,
    current_admin = Security(get_current_admin)
):
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid department ID"
        )

    department = db.departments.find_one({
        "_id": ObjectId(department_id)
    })

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    officers = []

    for officer in db.officers.find({
        "department_id": department_id
    }).sort("name", 1):
        officers.append({
            "id": str(officer["_id"]),
            "name": officer["name"],
            "email": officer["email"],
            "department_id": officer["department_id"],
            "department_name": department["name"],
        })

    return officers

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
    "role": existing_user["role"],
    "officer_id":
        existing_user.get("officer_id"),
    "department_id":
        existing_user.get(
            "department_id"
        )
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

