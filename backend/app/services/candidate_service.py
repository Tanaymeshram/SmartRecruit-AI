import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, UploadFile
from backend.app.core.config import settings
from backend.app.database.mongodb import get_db
from backend.app.ai.resume_parser.parser import resume_parser
from backend.app.ai.rag.engine import rag_engine

class CandidateService:
    @staticmethod
    async def upload_and_process_resume(
        file: UploadFile,
        current_user: dict,
        target_job_id: Optional[str] = None
    ) -> dict:
        # 1. Validation
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        candidate_id = str(uuid.uuid4())
        unique_filename = f"{candidate_id}_{file.filename}"
        save_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

        # 2. Save file
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

        # 3. Parse resume
        try:
            parsed = resume_parser.parse_resume(save_path, ext)
        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(status_code=400, detail=f"Failed to parse resume: {e}")

        db = get_db()
        now_iso = datetime.now(timezone.utc).isoformat()
        applied_jobs = [target_job_id] if target_job_id else []

        candidate_doc = {
            "_id": candidate_id,
            "company_id": current_user["company_id"],
            "full_name": parsed["full_name"],
            "email": parsed["email"],
            "phone": parsed["phone"],
            "location": parsed["location"],
            "linkedin": parsed["linkedin"],
            "github": parsed["github"],
            "total_experience_years": parsed["total_experience_years"],
            "summary": parsed["summary"],
            "skills": parsed["skills"],
            "skills_by_category": parsed["skills_by_category"],
            "experiences": parsed["experiences"],
            "educations": parsed["educations"],
            "projects": parsed["projects"],
            "certifications": parsed["certifications"],
            "resume_file_path": save_path,
            "resume_file_name": file.filename,
            "resume_text": parsed["raw_text"],
            "status": "new",
            "applied_job_ids": applied_jobs,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await db["candidates"].insert_one(candidate_doc)

        # 4. Ingest into RAG Vector Knowledge Base with company isolation
        rag_engine.ingest_document(
            document_id=candidate_id,
            title=f"Resume: {parsed['full_name']}",
            text=parsed["raw_text"],
            company_id=current_user["company_id"],
            scope="resumes",
            candidate_id=candidate_id,
            candidate_name=parsed["full_name"],
            sections=parsed.get("sections")
        )

        # 5. Log activity
        await db["activities"].insert_one({
            "_id": str(uuid.uuid4()),
            "company_id": current_user["company_id"],
            "user_name": current_user.get("full_name", "Recruiter"),
            "action": f"Uploaded & parsed resume for {parsed['full_name']}",
            "type": "resume",
            "created_at": now_iso
        })

        candidate_doc["id"] = candidate_id
        return candidate_doc

    @staticmethod
    async def get_candidates(
        current_user: dict,
        skill: Optional[str] = None,
        job_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[dict]:
        db = get_db()
        filter_dict = {"company_id": current_user["company_id"]}

        if skill:
            filter_dict["skills"] = {"$regex": f"^{skill}$", "$options": "i"}

        if job_id:
            filter_dict["applied_job_ids"] = job_id

        if search:
            filter_dict["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"skills": {"$regex": search, "$options": "i"}},
                {"summary": {"$regex": search, "$options": "i"}}
            ]

        candidates = await db["candidates"].find(filter_dict, sort=[("created_at", -1)])
        for c in candidates:
            c["id"] = str(c["_id"])
        return candidates

    @staticmethod
    async def get_candidate_by_id(candidate_id: str, current_user: dict) -> dict:
        db = get_db()
        candidate = await db["candidates"].find_one({"_id": candidate_id, "company_id": current_user["company_id"]})
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        candidate["id"] = str(candidate["_id"])
        return candidate

    @staticmethod
    async def update_candidate_status(candidate_id: str, new_status: str, current_user: dict) -> dict:
        db = get_db()
        existing = await db["candidates"].find_one({"_id": candidate_id, "company_id": current_user["company_id"]})
        if not existing:
            raise HTTPException(status_code=404, detail="Candidate not found")

        await db["candidates"].update_one(
            {"_id": candidate_id},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        updated = await db["candidates"].find_one({"_id": candidate_id})
        updated["id"] = str(updated["_id"])
        return updated

    @staticmethod
    async def delete_candidate(candidate_id: str, current_user: dict) -> bool:
        db = get_db()
        existing = await db["candidates"].find_one({"_id": candidate_id, "company_id": current_user["company_id"]})
        if not existing:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Delete resume file if exists
        file_path = existing.get("resume_file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        # Remove from vector store
        rag_engine.delete_document_chunks(candidate_id, current_user["company_id"])

        await db["candidates"].delete_one({"_id": candidate_id})
        await db["match_results"].delete_one({"candidate_id": candidate_id})
        return True

