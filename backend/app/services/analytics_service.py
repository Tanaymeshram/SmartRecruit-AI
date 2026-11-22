from collections import Counter
from backend.app.database.mongodb import get_db

class AnalyticsService:
    @staticmethod
    async def get_dashboard_analytics(current_user: dict) -> dict:
        db = get_db()
        company_id = current_user["company_id"]

        # Fetch records
        jobs = await db["jobs"].find({"company_id": company_id})
        candidates = await db["candidates"].find({"company_id": company_id})
        match_results = await db["match_results"].find({"company_id": company_id})
        activities = await db["activities"].find({"company_id": company_id}, sort=[("created_at", -1)], limit=8)

        total_jobs = len(jobs)
        total_candidates = len(candidates)
        total_resumes = total_candidates
        total_applications = sum(len(c.get("applied_job_ids", [])) for c in candidates)

        # Average match score
        scores = [m.get("scores", {}).get("overall_match_score", 0.0) for m in match_results]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

        # Pipeline stats
        status_counts = Counter(c.get("status", "new") for c in candidates)
        pipeline_stats = [
            {"stage": "New Resumes", "count": status_counts.get("new", 0)},
            {"stage": "Screened", "count": status_counts.get("screened", 0)},
            {"stage": "Interviewing", "count": status_counts.get("interviewing", 0)},
            {"stage": "Offered", "count": status_counts.get("offered", 0)},
            {"stage": "Hired", "count": status_counts.get("hired", 0)},
            {"stage": "Rejected", "count": status_counts.get("rejected", 0)},
        ]

        # Top demanded skills (from jobs)
        demanded_skills = Counter()
        for j in jobs:
            for s in j.get("required_skills", []):
                demanded_skills[s] += 2
            for s in j.get("preferred_skills", []):
                demanded_skills[s] += 1
        top_demanded = [{"skill": k, "count": v} for k, v in demanded_skills.most_common(10)]

        # Top candidate skills
        candidate_skills = Counter()
        for c in candidates:
            for s in c.get("skills", []):
                candidate_skills[s] += 1
        top_cand_skills = [{"skill": k, "count": v} for k, v in candidate_skills.most_common(10)]

        # Job distribution
        job_stats = []
        for j in jobs:
            j_id = str(j["_id"])
            j_matches = [m.get("scores", {}).get("overall_match_score", 0.0) for m in match_results if m.get("job_id") == j_id]
            avg_j_score = round(sum(j_matches) / len(j_matches), 1) if j_matches else 0.0
            app_cnt = sum(1 for c in candidates if j_id in c.get("applied_job_ids", []))
            job_stats.append({
                "job_id": j_id,
                "job_title": j.get("title", "Job"),
                "department": j.get("department", "Engineering"),
                "applications_count": app_cnt,
                "average_match_score": avg_j_score
            })

        for a in activities:
            a["id"] = str(a.get("_id"))

        return {
            "total_jobs": total_jobs,
            "total_resumes": total_resumes,
            "total_candidates": total_candidates,
            "total_applications": total_applications,
            "average_match_score": avg_score,
            "pipeline_statistics": pipeline_stats,
            "top_skills_demanded": top_demanded,
            "top_candidate_skills": top_cand_skills,
            "job_distribution": job_stats,
            "recent_activities": activities
        }

