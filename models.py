from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TokenGenerateRequest(BaseModel):
    patient_id: str

class TokenResponse(BaseModel):
    token_code: str
    patient_id: str
    created_at: datetime
    expires_at: Optional[datetime] = None

class ReportRequest(BaseModel):
    patient_id: str
    department: str

class ReportResponse(BaseModel):
    id: str
    patient_id: str
    department: str
    transcription: str
    report: str
    summary: str
    created_at: datetime

class ErrorResponse(BaseModel):
    error: str
    message: str 