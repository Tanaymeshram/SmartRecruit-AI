from fastapi.testclient import TestClient
from backend.app.main import app

def test_jobs_crud():
    with TestClient(app) as client:
        # 1. Login
        login_resp = client.post("/api/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Recruiter123!"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. List jobs
        jobs_resp = client.get("/api/jobs", headers=headers)
        assert jobs_resp.status_code == 200
        jobs = jobs_resp.json()
        assert len(jobs) >= 4

        # 3. Create job
        new_job = {
            "title": "Backend Distributed Systems Engineer",
            "department": "Platform",
            "location": "Remote",
            "job_type": "Full-time",
            "experience_required_years": 4.0,
            "education_required": "Bachelor's Degree",
            "description": "Building resilient event-driven architectures with Go, Kafka, and Kubernetes.",
            "required_skills": ["Go", "Kafka", "Kubernetes", "Docker"],
            "preferred_skills": ["AWS", "gRPC"],
            "status": "open"
        }
        create_resp = client.post("/api/jobs", json=new_job, headers=headers)
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["title"] == new_job["title"]
        job_id = created["id"]

        # 4. Get job by ID
        get_resp = client.get(f"/api/jobs/{job_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == job_id

        # 5. Clean up
        del_resp = client.delete(f"/api/jobs/{job_id}", headers=headers)
        assert del_resp.status_code == 200
