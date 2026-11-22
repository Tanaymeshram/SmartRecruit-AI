from pydantic import BaseModel, Field
from typing import Optional, List

class JobBase(BaseModel):
    title: str = Field(..., example="Senior Full-Stack Engineer")
    department: str = Field(..., example="Engineering")
    location: str = Field("Remote", example="Remote / Hybrid")
    job_type: str = Field("Full-time", example="Full-time")
    experience_required_years: float = Field(3.0, ge=0)
    education_required: str = Field("Bachelor's in Computer Science or related", example="Bachelor's Degree")
    description: str = Field(..., example="We are seeking an experienced Full-Stack Engineer...")
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    status: str = Field("open", example="open")  # open, closed, draft

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_required_years: Optional[float] = None
    education_required: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    status: Optional[str] = None

class JobResponse(JobBase):
    id: str
    company_id: str
    creator_id: str
    applications_count: int = 0
    created_at: str
    updated_at: str

