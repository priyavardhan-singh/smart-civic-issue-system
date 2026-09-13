from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import (
    FastAPI,
    HTTPException,
    File,
    Form,
    UploadFile,
    Depends,
    Security,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
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


# ---------------------------------------------------
# UPLOAD DIRECTORY
# ---------------------------------------------------

UPLOAD_DIR = (
    Path(__file__).resolve().parent
    / "uploads"
)

UPLOAD_DIR.mkdir(exist_ok=True)


app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)


# ---------------------------------------------------
# CORS
# ---------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------
# SECURITY
# ---------------------------------------------------

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials
    = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if (
            not user_id
            or not ObjectId.is_valid(
                user_id
            )
        ):
            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid authentication "
                    "token"
                ),
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "authentication token"
            ),
        )

    user = db.users.find_one(
        {
            "_id": ObjectId(
                user_id
            )
        }
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


def get_current_admin(
    current_user=Security(
        get_current_user
    )
):
    if (
        current_user.get("role")
        != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Admin access required"
            ),
        )

    return current_user


def get_current_officer(
    current_user=Security(
        get_current_user
    )
):
    if (
        current_user.get("role")
        != "officer"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Officer access required"
            ),
        )

    return current_user


# ---------------------------------------------------
# BASIC ROUTES
# ---------------------------------------------------

@app.get("/")
def root():
    return {
        "message":
            "Smart Civic API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.get("/db-health")
def database_health():
    db.command("ping")

    return {
        "status": "ok",
        "database": "connected",
    }


# ---------------------------------------------------
# REGISTER
# ---------------------------------------------------

@app.post("/register")
def register_user(
    user: UserRegister
):
    existing_user = (
        db.users.find_one(
            {
                "email":
                    user.email.lower()
            }
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Email already registered"
            ),
        )

    now = datetime.now(
        timezone.utc
    )

    user_data = {
        "name":
            user.name.strip(),

        "email":
            user.email.lower().strip(),

        "password_hash":
            hash_password(
                user.password
            ),

        "role":
            "citizen",

        "created_at":
            now,
    }

    result = (
        db.users.insert_one(
            user_data
        )
    )

    return {
        "message":
            "User registered successfully",

        "user_id":
            str(
                result.inserted_id
            ),

        "role":
            "citizen",
    }


# ---------------------------------------------------
# CREATE REPORT
# ---------------------------------------------------

@app.post("/reports")
def create_report(
    category: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    photo: UploadFile = File(...),
    current_user=Security(
        get_current_user
    ),
):
    if (
        not photo.content_type
        or not photo.content_type.startswith(
            "image/"
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Uploaded file must "
                "be an image"
            ),
        )

    file_extension = (
        Path(
            photo.filename or ""
        )
        .suffix
        .lower()
    )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    if (
        file_extension
        not in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format"
            ),
        )

    unique_filename = (
        f"{uuid4()}"
        f"{file_extension}"
    )

    file_path = (
        UPLOAD_DIR
        / unique_filename
    )

    with file_path.open(
        "wb"
    ) as buffer:
        shutil.copyfileobj(
            photo.file,
            buffer,
        )

    now = datetime.now(
        timezone.utc
    )

    report_data = {
    "user_id": str(
        current_user["_id"]
    ),

    "category":
        category,

    "description":
        description,

    "latitude":
        latitude,

    "longitude":
        longitude,

    "address":
        address,

    "photo_url":
        f"/uploads/{unique_filename}",

    "status":
        "reported",

    "activity_history": [
        {
            "type":
                "reported",

            "message":
                "Report submitted successfully",

            "created_at":
                now,
        }
    ],

    "created_at":
        now,

    "updated_at":
        now,
}

    result = (
        db.reports.insert_one(
            report_data
        )
    )

    return {
        "message":
            "Report created successfully",

        "report_id":
            str(
                result.inserted_id
            ),

        "status":
            "reported",

        "photo_url":
            f"/uploads/{unique_filename}",
    }


# ---------------------------------------------------
# ADMIN - GET ALL REPORTS
# ---------------------------------------------------

@app.get("/reports")
def get_reports(
    current_admin=Security(
        get_current_admin
    )
):
    reports = []

    for report in (
        db.reports.find()
    ):
        report["_id"] = str(
            report["_id"]
        )

        reports.append(
            report
        )

    return reports


# ---------------------------------------------------
# CITIZEN - MY REPORTS
# ---------------------------------------------------

@app.get("/my-reports")
def get_my_reports(
    current_user=Security(
        get_current_user
    )
):
    reports = []

    for report in (
        db.reports.find(
            {
                "user_id":
                    str(
                        current_user[
                            "_id"
                        ]
                    )
            }
        )
        .sort(
            "created_at",
            -1,
        )
    ):
        report["_id"] = str(
            report["_id"]
        )

        reports.append(
            report
        )

    return reports


# ---------------------------------------------------
# ADMIN - SINGLE REPORT
# ---------------------------------------------------

@app.get(
    "/reports/{report_id}"
)
def get_report(
    report_id: str,
    current_admin=Security(
        get_current_admin
    ),
):
    if not ObjectId.is_valid(
        report_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID",
        )

    report = (
        db.reports.find_one(
            {
                "_id":
                    ObjectId(
                        report_id
                    )
            }
        )
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    report["_id"] = str(
        report["_id"]
    )

    return report


# ---------------------------------------------------
# ADMIN - UPDATE REPORT STATUS
# ---------------------------------------------------

@app.patch(
    "/reports/{report_id}/status"
)
def update_report_status(
    report_id: str,
    status_update:
        ReportStatusUpdate,
    current_admin=Security(
        get_current_admin
    ),
):
    if not ObjectId.is_valid(
        report_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID",
        )

    allowed_statuses = [
        "reported",
        "assigned",
        "in_progress",
    ]

    # Admin cannot directly resolve.
    # Officer must submit proof.
    if (
        status_update.status
        == "resolved"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Reports can only be "
                "resolved by the assigned "
                "officer with resolution "
                "proof"
            ),
        )

    if (
        status_update.status
        not in allowed_statuses
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid report status"
            ),
        )

    result = (
        db.reports.update_one(
            {
                "_id":
                    ObjectId(
                        report_id
                    )
            },
            {
                "$set": {
                    "status":
                        status_update.status,

                    "updated_at":
                        datetime.now(
                            timezone.utc
                        ),
                }
            },
        )
    )

    if (
        result.matched_count
        == 0
    ):
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    return {
        "message":
            "Report status updated successfully",

        "status":
            status_update.status,
    }


# ---------------------------------------------------
# ADMIN - ASSIGN REPORT
# ---------------------------------------------------

@app.patch(
    "/reports/{report_id}/assign"
)
def assign_report(
    report_id: str,
    assignment: ReportAssignment,
    current_admin=Security(get_current_admin),
):
    if not ObjectId.is_valid(report_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID",
        )

    if not ObjectId.is_valid(assignment.department_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid department ID",
        )

    if not ObjectId.is_valid(assignment.officer_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid officer ID",
        )

    report = db.reports.find_one(
        {"_id": ObjectId(report_id)}
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    if report.get("status") == "resolved":
        raise HTTPException(
            status_code=400,
            detail="Resolved reports cannot be reassigned",
        )

    department = db.departments.find_one(
        {"_id": ObjectId(assignment.department_id)}
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    officer = db.officers.find_one(
        {"_id": ObjectId(assignment.officer_id)}
    )

    if not officer:
        raise HTTPException(
            status_code=404,
            detail="Officer not found",
        )

    if officer.get("department_id") != assignment.department_id:
        raise HTTPException(
            status_code=400,
            detail="Officer does not belong to selected department",
        )

    officer_user_id = officer.get("user_id")

    if (
        not officer_user_id
        or not ObjectId.is_valid(officer_user_id)
    ):
        raise HTTPException(
            status_code=400,
            detail="Selected officer does not have a valid login account",
        )

    linked_user = db.users.find_one(
        {"_id": ObjectId(officer_user_id)}
    )

    if (
        not linked_user
        or linked_user.get("role") != "officer"
        or linked_user.get("officer_id") != str(officer["_id"])
    ):
        raise HTTPException(
            status_code=400,
            detail="Selected officer account is not linked correctly",
        )

    # Keep officer collection synchronized with the officer login profile.
    db.officers.update_one(
        {"_id": officer["_id"]},
        {
            "$set": {
                "name": linked_user["name"],
                "email": linked_user["email"],
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    now = datetime.now(timezone.utc)

    result = db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "department_id": assignment.department_id,
                "department": department["name"],
                "assigned_officer_id": assignment.officer_id,
                "assigned_to": linked_user["name"],
                "assigned_at": now,
                "status": "assigned",
                "updated_at": now,
            },
            "$push": {
                "activity_history": {
                    "type": "assigned",
                    "message": (
                        f"Report assigned to {linked_user['name']} "
                        f"from {department['name']}"
                    ),
                    "created_at": now,
                }
            },
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    updated_report = db.reports.find_one(
        {"_id": ObjectId(report_id)}
    )

    updated_report["_id"] = str(updated_report["_id"])

    return {
        "message": "Report assigned successfully",
        "report": updated_report,
    }


# ---------------------------------------------------
# OFFICER - GET ASSIGNED REPORTS
# ---------------------------------------------------

@app.get(
    "/officer/reports"
)
def get_officer_reports(
    current_officer=Security(
        get_current_officer
    )
):
    officer_id = (
        current_officer.get(
            "officer_id"
        )
    )

    if not officer_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer account is "
                "not linked correctly"
            ),
        )

    reports = []

    for report in (
        db.reports.find(
            {
                "assigned_officer_id":
                    officer_id
            }
        )
        .sort(
            "created_at",
            -1,
        )
    ):
        report["_id"] = str(
            report["_id"]
        )

        reports.append(
            report
        )

    return reports


# ---------------------------------------------------
# OFFICER - START WORK
# ---------------------------------------------------

@app.patch(
    "/officer/reports/"
    "{report_id}/status"
)
def update_officer_report_status(
    report_id: str,
    status_update:
        ReportStatusUpdate,
    current_officer=Security(
        get_current_officer
    ),
):
    if not ObjectId.is_valid(
        report_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID",
        )

    officer_id = (
        current_officer.get(
            "officer_id"
        )
    )

    if not officer_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer account is "
                "not linked correctly"
            ),
        )

    report = (
        db.reports.find_one(
            {
                "_id":
                    ObjectId(
                        report_id
                    ),

                "assigned_officer_id":
                    officer_id,
            }
        )
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail=(
                "Assigned report "
                "not found"
            ),
        )

    if (
        report.get("status")
        != "assigned"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only assigned reports "
                "can be started"
            ),
        )

    if (
        status_update.status
        != "in_progress"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must change "
                "from assigned to "
                "in_progress"
            ),
        )

    now = datetime.now(
        timezone.utc
    )

    db.reports.update_one(
    {
        "_id":
            ObjectId(
                report_id
            ),

        "assigned_officer_id":
            officer_id,
    },
    {
        "$set": {
            "status":
                "in_progress",

            "work_started_at":
                now,

            "updated_at":
                now,
        },

        "$push": {
            "activity_history": {
                "type":
                    "in_progress",

                "message":
                    "Officer started working on the report",

                "created_at":
                    now,
            }
        },
    },
)

    return {
        "message":
            "Work started successfully",

        "status":
            "in_progress",
    }


# ---------------------------------------------------
# OFFICER - RESOLVE WITH PROOF
# ---------------------------------------------------

@app.post(
    "/officer/reports/"
    "{report_id}/resolve"
)
def resolve_officer_report(
    report_id: str,
    remarks: str = Form(...),
    resolution_photo:
        UploadFile = File(...),
    current_officer=Security(
        get_current_officer
    ),
):
    if not ObjectId.is_valid(
        report_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID",
        )

    officer_id = (
        current_officer.get(
            "officer_id"
        )
    )

    if not officer_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer account is "
                "not linked correctly"
            ),
        )

    report = (
        db.reports.find_one(
            {
                "_id":
                    ObjectId(
                        report_id
                    ),

                "assigned_officer_id":
                    officer_id,
            }
        )
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail=(
                "Assigned report "
                "not found"
            ),
        )

    if (
        report.get("status")
        != "in_progress"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Report must be in "
                "progress before it "
                "can be resolved"
            ),
        )

    clean_remarks = (
        remarks.strip()
    )

    if not clean_remarks:
        raise HTTPException(
            status_code=400,
            detail=(
                "Resolution remarks "
                "cannot be empty"
            ),
        )

    if (
        not resolution_photo
        .content_type
        or not resolution_photo
        .content_type
        .startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Resolution proof "
                "must be an image"
            ),
        )

    file_extension = (
        Path(
            resolution_photo
            .filename
            or ""
        )
        .suffix
        .lower()
    )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    if (
        file_extension
        not in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported resolution "
                "image format"
            ),
        )

    unique_filename = (
        f"resolution_{uuid4()}"
        f"{file_extension}"
    )

    file_path = (
        UPLOAD_DIR
        / unique_filename
    )

    with file_path.open(
        "wb"
    ) as buffer:
        shutil.copyfileobj(
            resolution_photo.file,
            buffer,
        )

    now = datetime.now(
        timezone.utc
    )

    resolution_photo_url = (
        f"/uploads/"
        f"{unique_filename}"
    )

    db.reports.update_one(
    {
        "_id":
            ObjectId(
                report_id
            ),

        "assigned_officer_id":
            officer_id,
    },
    {
        "$set": {
            "status":
                "resolved",

            "resolution_remarks":
                clean_remarks,

            "resolution_photo_url":
                resolution_photo_url,

            "resolved_at":
                now,

            "updated_at":
                now,
        },

        "$push": {
            "activity_history": {
                "type":
                    "resolved",

                "message":
                    "Issue resolved with officer proof",

                "created_at":
                    now,
            }
        },
    },
)   

    return {
        "message":
            "Report resolved successfully",

        "status":
            "resolved",

        "resolution_remarks":
            clean_remarks,

        "resolution_photo_url":
            resolution_photo_url,
    }


# ---------------------------------------------------
# ADMIN - CREATE DEPARTMENT
# ---------------------------------------------------

@app.post("/departments")
def create_department(
    department:
        DepartmentCreate,
    current_admin=Security(
        get_current_admin
    ),
):
    name = (
        department.name.strip()
    )

    if not name:
        raise HTTPException(
            status_code=400,
            detail=(
                "Department name "
                "cannot be empty"
            ),
        )

    existing_department = (
        db.departments.find_one(
            {
                "name": {
                    "$regex":
                        f"^{name}$",

                    "$options":
                        "i",
                }
            }
        )
    )

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail=(
                "Department already exists"
            ),
        )

    department_data = {
        "name":
            name,

        "created_at":
            datetime.now(
                timezone.utc
            ),
    }

    result = (
        db.departments.insert_one(
            department_data
        )
    )

    return {
        "message":
            "Department created successfully",

        "department": {
            "id":
                str(
                    result.inserted_id
                ),

            "name":
                name,
        },
    }


# ---------------------------------------------------
# ADMIN - GET DEPARTMENTS
# ---------------------------------------------------

@app.get("/departments")
def get_departments(
    current_admin=Security(
        get_current_admin
    )
):
    departments = []

    for department in (
        db.departments.find()
        .sort(
            "name",
            1,
        )
    ):
        departments.append(
            {
                "id":
                    str(
                        department[
                            "_id"
                        ]
                    ),

                "name":
                    department[
                        "name"
                    ],
            }
        )

    return departments


# ---------------------------------------------------
# ADMIN - CREATE OFFICER
# ---------------------------------------------------

@app.post("/officers")
def create_officer(
    officer: OfficerCreate,
    current_admin=Security(
        get_current_admin
    ),
):
    name = (
        officer.name.strip()
    )

    email = (
        officer.email
        .lower()
        .strip()
    )

    password = (
        officer.password
    )

    department_id = (
        officer.department_id
        .strip()
    )

    if not name:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer name "
                "cannot be empty"
            ),
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer email "
                "cannot be empty"
            ),
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer password "
                "cannot be empty"
            ),
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer password must "
                "be at least 6 characters"
            ),
        )

    if not ObjectId.is_valid(
        department_id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid department ID"
            ),
        )

    department = (
        db.departments.find_one(
            {
                "_id":
                    ObjectId(
                        department_id
                    )
            }
        )
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail=(
                "Department not found"
            ),
        )

    existing_officer = (
        db.officers.find_one(
            {
                "email":
                    email
            }
        )
    )

    if existing_officer:
        raise HTTPException(
            status_code=400,
            detail=(
                "Officer email "
                "already exists"
            ),
        )

    existing_user = (
        db.users.find_one(
            {
                "email":
                    email
            }
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Email already "
                "registered as a user"
            ),
        )

    now = datetime.now(
        timezone.utc
    )

    officer_data = {
        "name":
            name,

        "email":
            email,

        "department_id":
            department_id,

        "created_at":
            now,
    }

    officer_result = (
        db.officers.insert_one(
            officer_data
        )
    )

    officer_id = str(
        officer_result.inserted_id
    )

    user_data = {
        "name":
            name,

        "email":
            email,

        "password_hash":
            hash_password(
                password
            ),

        "role":
            "officer",

        "officer_id":
            officer_id,

        "department_id":
            department_id,

        "created_at":
            now,
    }

    user_result = (
        db.users.insert_one(
            user_data
        )
    )

    db.officers.update_one(
        {
            "_id":
                officer_result
                .inserted_id
        },
        {
            "$set": {
                "user_id":
                    str(
                        user_result
                        .inserted_id
                    )
            }
        },
    )

    return {
        "message":
            "Officer created successfully",

        "officer": {
            "id":
                officer_id,

            "user_id":
                str(
                    user_result
                    .inserted_id
                ),

            "name":
                name,

            "email":
                email,

            "department_id":
                department_id,

            "department_name":
                department[
                    "name"
                ],

            "role":
                "officer",
        },
    }


# ---------------------------------------------------
# ADMIN - GET OFFICERS BY DEPARTMENT
# ---------------------------------------------------

@app.get(
    "/departments/"
    "{department_id}/officers"
)
def get_department_officers(
    department_id: str,
    current_admin=Security(get_current_admin),
):
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid department ID",
        )

    department = db.departments.find_one(
        {"_id": ObjectId(department_id)}
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    officers = []

    for officer in db.officers.find(
        {"department_id": department_id}
    ).sort("name", 1):
        user_id = officer.get("user_id")

        if not user_id or not ObjectId.is_valid(user_id):
            continue

        linked_user = db.users.find_one(
            {"_id": ObjectId(user_id)}
        )

        if not linked_user:
            continue

        if linked_user.get("role") != "officer":
            continue

        if linked_user.get("officer_id") != str(officer["_id"]):
            continue

        # Keep the officer document synchronized with the login account.
        if (
            officer.get("name") != linked_user.get("name")
            or officer.get("email") != linked_user.get("email")
        ):
            db.officers.update_one(
                {"_id": officer["_id"]},
                {
                    "$set": {
                        "name": linked_user["name"],
                        "email": linked_user["email"],
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )

        officers.append(
            {
                "id": str(officer["_id"]),
                "user_id": str(linked_user["_id"]),
                "name": linked_user["name"],
                "email": linked_user["email"],
                "department_id": officer["department_id"],
                "department_name": department["name"],
            }
        )

    return officers


@app.delete("/officers/{officer_id}")
def delete_officer(
    officer_id: str,
    current_admin=Security(get_current_admin),
):
    if not ObjectId.is_valid(officer_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid officer ID",
        )

    officer = db.officers.find_one(
        {"_id": ObjectId(officer_id)}
    )

    if not officer:
        raise HTTPException(
            status_code=404,
            detail="Officer not found",
        )

    now = datetime.now(timezone.utc)

    # Any unresolved work assigned to this officer is returned for reassignment.
    db.reports.update_many(
        {
            "assigned_officer_id": officer_id,
            "status": {"$in": ["assigned", "in_progress"]},
        },
        {
            "$set": {
                "status": "reported",
                "updated_at": now,
            },
            "$unset": {
                "department_id": "",
                "department": "",
                "assigned_officer_id": "",
                "assigned_to": "",
                "assigned_at": "",
                "work_started_at": "",
            },
            "$push": {
                "activity_history": {
                    "type": "officer_removed",
                    "message": (
                        "Assigned officer account was removed. "
                        "Report returned for reassignment."
                    ),
                    "created_at": now,
                }
            },
        },
    )

    user_id = officer.get("user_id")

    if user_id and ObjectId.is_valid(user_id):
        db.users.delete_one(
            {"_id": ObjectId(user_id)}
        )
    else:
        # Fallback for older linked data.
        db.users.delete_many(
            {
                "role": "officer",
                "officer_id": officer_id,
            }
        )

    db.officers.delete_one(
        {"_id": ObjectId(officer_id)}
    )

    return {
        "message": "Officer account deleted successfully"
    }


# ---------------------------------------------------
# LOGIN
# ---------------------------------------------------

@app.post("/login")
def login_user(
    user: UserLogin
):
    existing_user = (
        db.users.find_one(
            {
                "email":
                    user.email
                    .lower()
                    .strip()
            }
        )
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )

    if not verify_password(
        user.password,
        existing_user[
            "password_hash"
        ],
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )

    access_token = (
        create_access_token(
            {
                "sub":
                    str(
                        existing_user[
                            "_id"
                        ]
                    ),

                "role":
                    existing_user[
                        "role"
                    ],
            }
        )
    )

    return {
        "message":
            "Login successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user": {
            "id":
                str(
                    existing_user[
                        "_id"
                    ]
                ),

            "name":
                existing_user[
                    "name"
                ],

            "email":
                existing_user[
                    "email"
                ],

            "role":
                existing_user[
                    "role"
                ],

            "officer_id":
                existing_user.get(
                    "officer_id"
                ),

            "department_id":
                existing_user.get(
                    "department_id"
                ),
        },
    }


# ---------------------------------------------------
# PROFILE
# ---------------------------------------------------

@app.get("/me")
def get_me(
    current_user=Security(
        get_current_user
    )
):
    return {
        "id":
            str(
                current_user["_id"]
            ),

        "name":
            current_user["name"],

        "email":
            current_user["email"],

        "role":
            current_user["role"],
    }


@app.patch("/me")
def update_me(
    profile_update: UserProfileUpdate,
    current_user=Security(get_current_user),
):
    name = profile_update.name.strip()
    email = profile_update.email.lower().strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty",
        )

    existing_email_user = db.users.find_one(
        {
            "email": email,
            "_id": {
                "$ne": current_user["_id"]
            },
        }
    )

    if existing_email_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    now = datetime.now(timezone.utc)

    db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "name": name,
                "email": email,
                "updated_at": now,
            }
        },
    )

    # If this user is an officer, update the officer record too.
    if current_user.get("role") == "officer":
        officer_id = current_user.get("officer_id")

        if officer_id and ObjectId.is_valid(officer_id):
            db.officers.update_one(
                {"_id": ObjectId(officer_id)},
                {
                    "$set": {
                        "name": name,
                        "email": email,
                        "updated_at": now,
                    }
                },
            )

    updated_user = db.users.find_one(
        {"_id": current_user["_id"]}
    )

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user["role"],
            "officer_id": updated_user.get("officer_id"),
            "department_id": updated_user.get("department_id"),
        },
    }

