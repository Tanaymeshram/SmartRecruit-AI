from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class SkillGapDetail(BaseModel):
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)
    missing_required_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    related_skills: List[str] = Field(default_factory=list)
    gap_summary: str = ""
    learning_recommendations: List[str] = Field(default_factory=list)

class MatchScoreBreakdown(BaseModel):
    semantic_similarity_score: float  # 0 to 100
    required_skills_score: float     # 0 to 100
    preferred_skills_score: float    # 0 to 100
    experience_score: float          # 0 to 100
    overall_match_score: float       # weighted 0 to 100

class MatchResultResponse(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    scores: MatchScoreBreakdown
    skill_gap: SkillGapDetail
    relevance_explanation: str
    created_at: str

class MatchBatchRequest(BaseModel):
    job_id: str
    candidate_ids: Optional[List[str]] = None  # None matches all candidates for the company

class CandidateCompareRequest(BaseModel):
    job_id: Optional[str] = None
    candidate_ids: List[str] = Field(..., min_items=2, max_items=4)

