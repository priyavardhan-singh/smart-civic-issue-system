from pydantic import BaseModel


class ReportCreate(BaseModel):
    category: str
    description: str
    latitude: float
    longitude: float
    address: str


class ReportStatusUpdate(BaseModel):
    status: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: str
    email: str

class ReportAssignment(BaseModel):
    department_id: str
    officer_id: str

class DepartmentCreate(BaseModel):
    name: str


class OfficerCreate(BaseModel):
    name: str
    email: str
    password: str
    department_id: str