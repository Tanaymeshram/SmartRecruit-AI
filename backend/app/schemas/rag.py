from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Citation(BaseModel):
    document_id: str
    document_title: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    section: Optional[str] = None
    snippet: str
    relevance_score: float

class RagQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, example="Which candidates have extensive experience with FastAPI and PostgreSQL?")
    scope: str = Field("resumes", example="resumes")  # "resumes" or "company_knowledge"
    candidate_ids: Optional[List[str]] = None
    job_id: Optional[str] = None
    top_k: int = Field(5, ge=1, le=15)

class RagQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    confidence: float
    retrieval_method: str = "hybrid (dense + bm25 + cross-encoder rerank)"
    model_used: str
    is_demo_mode: bool

