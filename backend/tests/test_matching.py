from fastapi.testclient import TestClient
from backend.app.main import app

def test_matching_and_rankings():
    with TestClient(app) as client:
        # Login
        login_resp = client.post("/api/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Recruiter123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Match Alex Rivera with Senior Full-Stack AI Engineer (job-001)
        match_resp = client.post(
            "/api/matching/match?candidate_id=cand-001&job_id=job-001",
            headers=headers
        )
        assert match_resp.status_code == 200
        match_data = match_resp.json()
        assert "scores" in match_data
        assert match_data["scores"]["overall_match_score"] > 60.0
        assert "Python" in match_data["skill_gap"]["matched_skills"]
        assert "FastAPI" in match_data["skill_gap"]["matched_skills"]

        # Get Rankings for job-001
        rankings_resp = client.get("/api/matching/rankings/job-001", headers=headers)
        assert rankings_resp.status_code == 200
        rankings = rankings_resp.json()
        assert len(rankings) >= 2
        # Verify ranking is sorted in descending order
        scores = [r["scores"]["overall_match_score"] for r in rankings]
        assert scores == sorted(scores, reverse=True)

def test_rag_knowledge_search():
    with TestClient(app) as client:
        login_resp = client.post("/api/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Recruiter123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query candidate knowledge base
        rag_resp = client.post("/api/rag/query", json={
            "query": "Which candidate has extensive experience in FastAPI, React, and RAG pipelines?",
            "scope": "resumes",
            "top_k": 3
        }, headers=headers)
        assert rag_resp.status_code == 200
        rag_data = rag_resp.json()
        assert "answer" in rag_data
        assert len(rag_data["citations"]) > 0
        assert "Alex Rivera" in rag_data["answer"] or any("Alex Rivera" in c["candidate_name"] for c in rag_data["citations"])
