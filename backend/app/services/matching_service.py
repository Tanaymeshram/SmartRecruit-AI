import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from backend.app.database.mongodb import get_db
from backend.app.ai.matching.matcher import matcher

class MatchingService:
    @staticmethod
    async def match_candidate_job(candidate_id: str, job_id: str, current_user: dict) -> dict:
        db = get_db()
        candidate = await db["candidates"].find_one({"_id": candidate_id, "company_id": current_user["company_id"]})
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        job = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Run multi-dimensional matching engine
        match_output = matcher.compute_match(candidate, job)
        now_iso = datetime.now(timezone.utc).isoformat()
        match_id = f"{candidate_id}_{job_id}"

        match_doc = {
            "_id": match_id,
            "company_id": current_user["company_id"],
            "candidate_id": candidate_id,
            "candidate_name": candidate.get("full_name", "Candidate"),
            "job_id": job_id,
            "job_title": job.get("title", "Job Opening"),
            "scores": match_output["scores"],
            "skill_gap": match_output["skill_gap"],
            "relevance_explanation": match_output["relevance_explanation"],
            "created_at": now_iso,
            "updated_at": now_iso
        }

        # Upsert match result
        existing = await db["match_results"].find_one({"_id": match_id})
        if existing:
            await db["match_results"].update_one({"_id": match_id}, {"$set": match_doc})
        else:
            await db["match_results"].insert_one(match_doc)

        match_doc["id"] = match_id
        return match_doc

    @staticmethod
    async def get_rankings_for_job(job_id: str, current_user: dict) -> List[dict]:
        db = get_db()
        job = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        candidates = await db["candidates"].find({"company_id": current_user["company_id"]})
        rankings = []

        for cand in candidates:
            cand_id = str(cand["_id"])
            match_id = f"{cand_id}_{job_id}"
            cached_match = await db["match_results"].find_one({"_id": match_id})

            if not cached_match:
                # Calculate fresh
                match_output = matcher.compute_match(cand, job)
                now_iso = datetime.now(timezone.utc).isoformat()
                cached_match = {
                    "_id": match_id,
                    "company_id": current_user["company_id"],
                    "candidate_id": cand_id,
                    "candidate_name": cand.get("full_name", "Candidate"),
                    "job_id": job_id,
                    "job_title": job.get("title", "Job Opening"),
                    "scores": match_output["scores"],
                    "skill_gap": match_output["skill_gap"],
                    "relevance_explanation": match_output["relevance_explanation"],
                    "created_at": now_iso,
                    "updated_at": now_iso
                }
                await db["match_results"].insert_one(cached_match)

            cached_match["id"] = str(cached_match["_id"])
            cached_match["candidate"] = {
                "id": cand_id,
                "full_name": cand.get("full_name"),
                "email": cand.get("email"),
                "total_experience_years": cand.get("total_experience_years"),
                "skills": cand.get("skills", []),
                "status": cand.get("status", "new")
            }
            rankings.append(cached_match)

        # Objective, merit-based ranking sorted by overall match score descending
        rankings.sort(key=lambda x: x["scores"]["overall_match_score"], reverse=True)
        return rankings

    @staticmethod
    async def compare_candidates(candidate_ids: List[str], current_user: dict, job_id: Optional[str] = None) -> dict:
        db = get_db()
        candidates = []
        for c_id in candidate_ids:
            c = await db["candidates"].find_one({"_id": c_id, "company_id": current_user["company_id"]})
            if c:
                c["id"] = str(c["_id"])
                candidates.append(c)

        if len(candidates) < 2:
            raise HTTPException(status_code=400, detail="At least 2 valid candidates are required for comparison.")

        job = None
        if job_id:
            job = await db["jobs"].find_one({"_id": job_id, "company_id": current_user["company_id"]})

        comparison_matrix = []
        for cand in candidates:
            match_data = None
            if job:
                match_data = matcher.compute_match(cand, job)
            comparison_matrix.append({
                "candidate_id": cand["id"],
                "candidate_name": cand.get("full_name"),
                "experience_years": cand.get("total_experience_years", 0),
                "skills": cand.get("skills", []),
                "educations": cand.get("educations", []),
                "projects_count": len(cand.get("projects", [])),
                "status": cand.get("status", "new"),
                "match_scores": match_data["scores"] if match_data else None,
                "skill_gap": match_data["skill_gap"] if match_data else None
            })

        return {
            "job_title": job.get("title") if job else "General Comparison",
            "comparison_matrix": comparison_matrix
        }

