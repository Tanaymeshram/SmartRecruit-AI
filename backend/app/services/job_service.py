import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from backend.app.database.mongodb import get_db
from backend.app.schemas.job import JobCreate, JobUpdate
from backend.app.ai.skill_extractor.extractor import skill_extractor

class JobService:
    @staticmethod
    async def create_job(job_in: JobCreate, current_user: dict) -> dict:
        db = get_db()
        job_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        req_skills = job_in.required_skills
        pref_skills = job_in.preferred_skills

        # Auto-extract skills if user didn't explicitly specify them
        if not req_skills:
            extracted = skill_extractor.extract_skills(job_in.description)
            req_skills = extracted[:6]
            pref_skills = extracted[6:10]

        job_doc = {
            "_id": job_id,
            "company_id": current_user["company_id"],
            "creator_id": current_user["id"],
            "title": job_in.title,
            "department": job_in.department,
            "location": job_in.location,
            "job_type": job_in.job_type,
            "experience_required_years": job_in.experience_required_years,
            "education_required": job_in.education_required,
            "description": job_in.description,
            "required_skills": req_skills,
            "preferred_skills": pref_skills,
            "status": job_in.status,
            "applications_count": 0,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await db["jobs"].insert_one(job_doc)

        # Log activity
        await db["activities"].insert_one({
            "_id": str(uuid.uuid4()),
            "company_id": current_user["company_id"],
            "user_name": current_user.get("full_name", "Recruiter"),
            "action": f"Created new job opening: {job_in.title}",
            "type": "job",
            "created_at": now_iso
        })

        job_doc["id"] = job_id
        return job_doc

    @staticmethod
    async def get_jobs(current_user: dict, status: Optional[str] = None, department: Optional[str] = None) -> List[dict]:
        db = get_db()
        filter_dict = {"company_id": current_user["company_id"]}
        if status:
            filter_dict["status"] = status
        if department:
            filter_dict["department"] = department

        jobs = await db["jobs"].find(filter_dict, sort=[("created_at", -1)])
        for j in jobs:
            j["id"] = str(j["_id"])
            # Update application count dynamically
            app_count = await db["applications"].count_documents({"job_id": j["id"], "company_id": current_user["company_id"]})
            j["applications_count"] = app_count
        return jobs

    @staticmethod
    async def get_job_by_id(job_id: str, current_user: dict) -> dict:
        db = get_db()
        job = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        job["id"] = str(job["_id"])
        app_count = await db["applications"].count_documents({"job_id": job["id"], "company_id": current_user["company_id"]})
        job["applications_count"] = app_count
        return job

    @staticmethod
    async def update_job(job_id: str, job_in: JobUpdate, current_user: dict) -> dict:
        db = get_db()
        existing = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})
        if not existing:
            raise HTTPException(status_code=404, detail="Job not found")

        update_data = {k: v for k, v in job_in.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        await db["jobs"].update_one({"_id": job_id}, {"$set": update_data})
        updated = await db["jobs"].find_one({"_id": job_id})
        updated["id"] = str(updated["_id"])
        return updated

    @staticmethod
    async def delete_job(job_id: str, current_user: dict) -> bool:
        db = get_db()
        existing = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})
        if not existing:
            raise HTTPException(status_code=404, detail="Job not found")

        await db["jobs"].delete_one({"_id": job_id})
        await db["match_results"].delete_one({"job_id": job_id})
        return True

