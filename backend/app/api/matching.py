from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from backend.app.schemas.matching import MatchResultResponse, CandidateCompareRequest
from backend.app.services.matching_service import MatchingService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/matching", tags=["AI Matching & Ranking"])

@router.post("/match", response_model=MatchResultResponse)
async def match_candidate(
    candidate_id: str = Query(...),
    job_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return await MatchingService.match_candidate_job(candidate_id, job_id, current_user)

@router.get("/rankings/{job_id}", response_model=List[dict])
async def get_job_rankings(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await MatchingService.get_rankings_for_job(job_id, current_user)

@router.post("/compare")
async def compare_candidates(
    req: CandidateCompareRequest,
    current_user: dict = Depends(get_current_user)
):
    return await MatchingService.compare_candidates(req.candidate_ids, current_user, job_id=req.job_id)

