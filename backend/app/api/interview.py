from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from backend.app.schemas.interview import InterviewQuestionRequest, InterviewQuestionResponse
from backend.app.services.candidate_service import CandidateService
from backend.app.services.job_service import JobService
from backend.app.services.auth_service import get_current_user
from backend.app.ai.interview_generator.generator import interview_generator
from backend.app.core.config import settings

router = APIRouter(prefix="/interview", tags=["AI Interview Question Generator"])

@router.post("/generate", response_model=InterviewQuestionResponse)
async def generate_questions(
    req: InterviewQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    candidate = await CandidateService.get_candidate_by_id(req.candidate_id, current_user)
    job = None
    if req.job_id:
        job = await JobService.get_job_by_id(req.job_id, current_user)

    questions = interview_generator.generate_questions(
        candidate_data=candidate,
        job_data=job,
        difficulty=req.difficulty or "Mid",
        categories=req.include_categories
    )

    return {
        "candidate_id": candidate["id"],
        "candidate_name": candidate.get("full_name", "Candidate"),
        "job_id": job.get("id") if job else None,
        "job_title": job.get("title") if job else None,
        "questions": questions,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_used": "TalentMatch AI Interview Engine"
    }

