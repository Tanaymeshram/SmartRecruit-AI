from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from backend.app.schemas.job import JobCreate, JobUpdate, JobResponse
from backend.app.services.job_service import JobService
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.post("", response_model=JobResponse)
async def create_job(job_in: JobCreate, current_user: dict = Depends(get_current_user)):
    return await JobService.create_job(job_in, current_user)

@router.get("", response_model=List[JobResponse])
async def get_jobs(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return await JobService.get_jobs(current_user, status=status, department=department)

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    return await JobService.get_job_by_id(job_id, current_user)

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_in: JobUpdate, current_user: dict = Depends(get_current_user)):
    return await JobService.update_job(job_id, job_in, current_user)

@router.delete("/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    success = await JobService.delete_job(job_id, current_user)
    return {"success": success, "message": "Job successfully deleted"}

