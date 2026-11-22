from pydantic import BaseModel, Field
from typing import Optional, List

class InterviewQuestion(BaseModel):
    category: str  # Technical, Conceptual, Project-Based, Problem-Solving
    difficulty: str  # Junior, Mid, Senior, Lead
    question: str
    expected_answer_summary: str
    evaluation_criteria: List[str]
    context_source: Optional[str] = None

class InterviewQuestionRequest(BaseModel):
    candidate_id: str
    job_id: Optional[str] = None
    difficulty: Optional[str] = "Mid"
    include_categories: Optional[List[str]] = None

class InterviewQuestionResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    questions: List[InterviewQuestion]
    generated_at: str
    model_used: str

