from pydantic import BaseModel


class ReportCreate(BaseModel):
    category: str
    description: str
    latitude: float
    longitude: float
    address: str


class ReportStatusUpdate(BaseModel):
    status: str