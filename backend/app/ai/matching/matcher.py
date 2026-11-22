import logging
from typing import Dict, Any, List
from backend.app.ai.embeddings.embedder import embedder
from backend.app.ai.skill_extractor.taxonomy import SKILL_RELATIONS

logger = logging.getLogger("talentmatch.matcher")

class ResumeJobMatcher:
    """Explainable resume-to-job matching and scoring engine."""

    def compute_match(
        self,
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates multi-dimensional matching scores and explainable skill gap."""
        cand_skills = set(candidate_data.get("skills", []))
        req_skills = set(job_data.get("required_skills", []))
        pref_skills = set(job_data.get("preferred_skills", []))
        cand_exp = float(candidate_data.get("total_experience_years", 0.0))
        req_exp = float(job_data.get("experience_required_years", 0.0))

        # 1. Skill Overlap Calculation
        matched_req = sorted(list(cand_skills.intersection(req_skills)))
        missing_req = sorted(list(req_skills.difference(cand_skills)))
        matched_pref = sorted(list(cand_skills.intersection(pref_skills)))
        missing_pref = sorted(list(pref_skills.difference(cand_skills)))

        # 2. Skill Scores
        req_score = (len(matched_req) / len(req_skills) * 100.0) if req_skills else 100.0
        pref_score = (len(matched_pref) / len(pref_skills) * 100.0) if pref_skills else 100.0

        # 3. Related Skills Discovery
        related_skills_found = set()
        for missing in missing_req:
            for cand_s in cand_skills:
                if missing in SKILL_RELATIONS.get(cand_s, []) or cand_s in SKILL_RELATIONS.get(missing, []):
                    related_skills_found.add(cand_s)

        # 4. Semantic Similarity Calculation
        resume_summary_text = (
            f"{candidate_data.get('summary', '')} "
            f"Skills: {', '.join(cand_skills)}. "
            f"Experience: {cand_exp} years. "
            f"{candidate_data.get('raw_text', '')[:1000]}"
        )
        job_text = (
            f"Job Title: {job_data.get('title', '')}. "
            f"Department: {job_data.get('department', '')}. "
            f"Description: {job_data.get('description', '')}. "
            f"Required Skills: {', '.join(req_skills)}. "
            f"Preferred: {', '.join(pref_skills)}"
        )

        cand_emb = embedder.embed_query(resume_summary_text)
        job_emb = embedder.embed_query(job_text)
        cosine_sim = embedder.compute_similarity(cand_emb, job_emb)
        semantic_score = round(cosine_sim * 100.0, 1)

        # 5. Experience Score (fair curve)
        if req_exp <= 0:
            exp_score = 100.0
        elif cand_exp >= req_exp:
            exp_score = 100.0
        else:
            exp_score = round((cand_exp / req_exp) * 100.0, 1)

        # 6. Overall Weighted Score:
        # 40% Required Skills, 15% Preferred Skills, 30% Semantic Similarity, 15% Experience
        overall_score = round(
            (req_score * 0.40) +
            (pref_score * 0.15) +
            (semantic_score * 0.30) +
            (exp_score * 0.15),
            1
        )

        # 7. Generate Explainable Reasoning
        explanation_points = []
        if req_score >= 80:
            explanation_points.append(f"Strong alignment with mandatory technical requirements, matching {len(matched_req)} of {len(req_skills)} required skills ({', '.join(matched_req[:4])}).")
        elif req_score >= 50:
            explanation_points.append(f"Moderate match on core technical skills, possessing {len(matched_req)} of {len(req_skills)} required skills.")
        else:
            explanation_points.append(f"Candidate currently matches {len(matched_req)} of {len(req_skills)} core required skills.")

        if missing_req:
            explanation_points.append(f"Key skill gaps identified in: {', '.join(missing_req[:4])}.")

        if related_skills_found:
            explanation_points.append(f"Beneficial adjacent experience in complementary technologies: {', '.join(list(related_skills_found)[:3])}.")

        if cand_exp >= req_exp:
            explanation_points.append(f"Meets or exceeds target experience expectation ({cand_exp:.1f} yrs vs {req_exp:.1f} yrs requested).")
        else:
            explanation_points.append(f"Experience is {cand_exp:.1f} years compared to target of {req_exp:.1f} years.")

        relevance_explanation = " ".join(explanation_points)

        # 8. Learning recommendations
        recommendations = [f"Complete upskilling or project certification in {s}." for s in missing_req[:3]]
        if not recommendations:
            recommendations = ["Candidate demonstrates strong proficiency across required stack; recommended for interview technical screen."]

        return {
            "scores": {
                "semantic_similarity_score": round(semantic_score, 1),
                "required_skills_score": round(req_score, 1),
                "preferred_skills_score": round(pref_score, 1),
                "experience_score": round(exp_score, 1),
                "overall_match_score": round(overall_score, 1)
            },
            "skill_gap": {
                "required_skills": sorted(list(req_skills)),
                "preferred_skills": sorted(list(pref_skills)),
                "matched_skills": matched_req,
                "missing_required_skills": missing_req,
                "missing_preferred_skills": missing_pref,
                "related_skills": sorted(list(related_skills_found)),
                "gap_summary": f"Matches {len(matched_req)}/{len(req_skills)} required skills, {len(matched_pref)}/{len(pref_skills)} preferred skills.",
                "learning_recommendations": recommendations
            },
            "relevance_explanation": relevance_explanation
        }

matcher = ResumeJobMatcher()

