from fastapi.testclient import TestClient
from backend.app.main import app

def test_health_and_root():
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        resp2 = client.get("/")
        assert resp2.status_code == 200
        assert resp2.json()["platform"] == "TalentMatch AI"

def test_auth_login():
    with TestClient(app) as client:
        resp = client.post("/api/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Recruiter123!"
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "recruiter@techcorp.com"
