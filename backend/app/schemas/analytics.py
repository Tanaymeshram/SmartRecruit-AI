from pydantic import BaseModel
from typing import List, Dict, Any

class SkillCount(BaseModel):
    skill: str
    count: int

class PipelineCount(BaseModel):
    stage: str
    count: int

class JobStat(BaseModel):
    job_id: str
    job_title: str
    department: str
    applications_count: int
    average_match_score: float

class DashboardAnalyticsResponse(BaseModel):
    total_jobs: int
    total_resumes: int
    total_candidates: int
    total_applications: int
    average_match_score: float
    pipeline_statistics: List[PipelineCount]
    top_skills_demanded: List[SkillCount]
    top_candidate_skills: List[SkillCount]
    job_distribution: List[JobStat]
    recent_activities: List[Dict[str, Any]]

