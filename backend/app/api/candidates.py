from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from typing import List, Optional
from backend.app.schemas.candidate import CandidateResponse
from backend.app.services.candidate_service import CandidateService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/candidates", tags=["Candidates & Resumes"])

@router.post("/upload", response_model=CandidateResponse)
async def upload_resume(
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    return await CandidateService.upload_and_process_resume(file, current_user, target_job_id=job_id)

@router.get("", response_model=List[CandidateResponse])
async def get_candidates(
    skill: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await CandidateService.get_candidates(current_user, skill=skill, job_id=job_id, search=search)

@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    return await CandidateService.get_candidate_by_id(candidate_id, current_user)

@router.patch("/{candidate_id}/status", response_model=CandidateResponse)
async def update_status(
    candidate_id: str,
    status: str = Query(..., pattern="^(new|screened|interviewing|offered|hired|rejected)$"),
    current_user: dict = Depends(get_current_user)
):
    return await CandidateService.update_candidate_status(candidate_id, status, current_user)

@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: str, current_user: dict = Depends(get_current_user)):
    success = await CandidateService.delete_candidate(candidate_id, current_user)
    return {"success": success, "message": "Candidate profile and vectors deleted"}

