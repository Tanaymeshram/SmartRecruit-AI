from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class ExperienceItem(BaseModel):
    title: str
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

class EducationItem(BaseModel):
    degree: str
    institution: Optional[str] = None
    year: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class CandidateBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    total_experience_years: float = 0.0
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    skills_by_category: Dict[str, List[str]] = Field(default_factory=dict)
    experiences: List[ExperienceItem] = Field(default_factory=list)
    educations: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

class CandidateCreate(CandidateBase):
    resume_file_path: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_text: Optional[str] = None

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    total_experience_years: Optional[float] = None
    skills: Optional[List[str]] = None
    summary: Optional[str] = None

class CandidateResponse(CandidateBase):
    id: str
    company_id: str
    resume_file_name: Optional[str] = None
    status: str = "new"  # new, screened, interviewing, offered, hired, rejected
    match_score: Optional[float] = None
    applied_job_ids: List[str] = Field(default_factory=list)
    created_at: str
    updated_at: str

