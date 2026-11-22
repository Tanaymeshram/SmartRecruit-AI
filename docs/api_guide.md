# TalentMatch AI – REST API Guide

Interactive Swagger documentation is served at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

## Authentication Endpoints
- `POST /api/auth/register`: Register recruiter and create organization company tenant.
- `POST /api/auth/login`: Authenticate recruiter credentials and receive Bearer JWT token.
- `GET /api/auth/me`: Fetch current recruiter and organization profile.

## Job Management Endpoints
- `POST /api/jobs`: Create job opening with automatic NLP skill extraction.
- `GET /api/jobs`: List organization jobs with status and department filters.
- `GET /api/jobs/{job_id}`: Retrieve detailed job specifications and applicant count.
- `PUT /api/jobs/{job_id}`: Update job requirements and status.
- `DELETE /api/jobs/{job_id}`: Delete job posting and associated match records.

## Candidates & Resumes Endpoints
- `POST /api/candidates/upload`: Upload PDF or DOCX resume, extract text, extract entities and vectorize chunks into ChromaDB.
- `GET /api/candidates`: Query candidates with skill, job, and full-text keyword search.
- `GET /api/candidates/{candidate_id}`: Retrieve candidate dossier.
- `PATCH /api/candidates/{candidate_id}/status`: Transition candidate through hiring pipeline stages (`new`, `screened`, `interviewing`, `offered`, `hired`, `rejected`).
- `DELETE /api/candidates/{candidate_id}`: Delete candidate profile and clean up ChromaDB vectors.

## AI Matching & Ranking Endpoints
- `POST /api/matching/match?candidate_id={id}&job_id={id}`: Compute multi-dimensional relevance match score, skill gap breakdown, and explainable summary.
- `GET /api/matching/rankings/{job_id}`: Retrieve merit-ranked candidate leaderboard for a specific job opening.
- `POST /api/matching/compare`: Compare 2 to 4 candidates side-by-side with comparison matrix.

## RAG Knowledge Endpoints
- `POST /api/rag/query`: Hybrid vector + BM25 search with Cross-Encoder reranking and citation-grounded synthesis.
- `POST /api/rag/documents/upload`: Ingest company HR policies, guidelines, and interview rubrics.
- `GET /api/rag/documents`: List company knowledge base documents.

## AI Interview Generator Endpoints
- `POST /api/interview/generate`: Formulate technical, conceptual, project-based, and problem-solving questions with difficulty rubrics and expected answers.

## Analytics Endpoints
- `GET /api/analytics/dashboard`: Aggregate KPI metrics, pipeline funnel counts, skill supply/demand, and recent audit activities.
