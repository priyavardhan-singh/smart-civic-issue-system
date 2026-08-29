from datetime import datetime, timezone


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import db
from models import ReportCreate
from bson import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

@app.post("/reports")
def create_report(report: ReportCreate):
    now = datetime.now(timezone.utc)

    report_data = report.model_dump()

    report_data["status"] = "reported"
    report_data["created_at"] = now
    report_data["updated_at"] = now

    result = db.reports.insert_one(report_data)

    return {
        "message": "Report created successfully",
        "report_id": str(result.inserted_id),
        "status": "reported"
    }

@app.get("/reports")
def get_reports():
    reports = []

    for report in db.reports.find():
        report["_id"] = str(report["_id"])
        reports.append(report)

    return reports

@app.get("/reports/{report_id}")
def get_report(report_id: str):
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