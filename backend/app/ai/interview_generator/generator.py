import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from backend.app.core.config import settings

logger = logging.getLogger("talentmatch.interview_generator")

class InterviewGenerator:
    """Generates structured, fair, and evidence-based interview questions tailored to candidate projects and job stack."""

    def generate_questions(
        self,
        candidate_data: Dict[str, Any],
        job_data: Optional[Dict[str, Any]] = None,
        difficulty: str = "Mid",
        categories: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Generate categorized interview questions with rubrics."""
        skills = candidate_data.get("skills", [])
        projects = candidate_data.get("projects", [])
        cand_name = candidate_data.get("full_name", "Candidate")
        job_title = job_data.get("title", "Software Engineer") if job_data else "Software Engineer"
        req_skills = job_data.get("required_skills", []) if job_data else skills[:5]

        # Target categories: Technical, Conceptual, Project-Based, Problem-Solving
        requested_cats = categories or ["Technical", "Conceptual", "Project-Based", "Problem-Solving"]
        questions = []

        # 1. Technical Questions
        if "Technical" in requested_cats:
            primary_skill = req_skills[0] if req_skills else (skills[0] if skills else "Python")
            secondary_skill = req_skills[1] if len(req_skills) > 1 else (skills[1] if len(skills) > 1 else "REST APIs")

            questions.append({
                "category": "Technical",
                "difficulty": difficulty,
                "question": f"How do you optimize asynchronous concurrency and throughput when designing services with {primary_skill} and {secondary_skill}?",
                "expected_answer_summary": f"Candidate should discuss event loops, thread pools vs async I/O, connection pooling, and latency profiling under concurrent load.",
                "evaluation_criteria": [
                    f"Understanding of {primary_skill} execution model",
                    "Knowledge of database connection pooling and I/O bottlenecks",
                    "Practical strategies for benchmarking and profiling"
                ],
                "context_source": f"Matched required skill: {primary_skill}, {secondary_skill}"
            })

            if len(skills) > 2:
                third_skill = skills[2]
                questions.append({
                    "category": "Technical",
                    "difficulty": difficulty,
                    "question": f"In your experience with {third_skill}, what are the most critical pitfalls or architectural trade-offs to monitor during deployment?",
                    "expected_answer_summary": f"Discussion of memory management, failure modes, logging, and backward compatibility.",
                    "evaluation_criteria": [
                        f"Hands-on proficiency with {third_skill}",
                        "Understanding of production reliability"
                    ],
                    "context_source": f"Candidate verified skill: {third_skill}"
                })

        # 2. Conceptual Questions
        if "Conceptual" in requested_cats:
            questions.append({
                "category": "Conceptual",
                "difficulty": difficulty,
                "question": f"Explain the architectural trade-offs between monolithic, modular monolith, and microservice architectures for a platform like {job_title}.",
                "expected_answer_summary": "Candidate should articulate operational complexity, network boundaries, distributed data consistency, and organizational team scaling.",
                "evaluation_criteria": [
                    "Clarity on domain boundaries and DDD principles",
                    "Realistic evaluation of operational overhead vs team autonomy",
                    "Database per service vs shared datastore trade-offs"
                ],
                "context_source": f"Target Position: {job_title}"
            })

        # 3. Project-Based Questions
        if "Project-Based" in requested_cats:
            if projects:
                top_proj = projects[0]
                proj_name = top_proj.get("name", "Key Project")
                proj_tech = ", ".join(top_proj.get("technologies", [])[:3]) or "core technologies"
                questions.append({
                    "category": "Project-Based",
                    "difficulty": difficulty,
                    "question": f"In your project '{proj_name}', walk us through an unexpected engineering roadblock you encountered while implementing {proj_tech} and how you resolved it.",
                    "expected_answer_summary": f"Candidate should explain problem discovery, root-cause analysis, alternative approaches considered, and measurable outcome.",
                    "evaluation_criteria": [
                        "Demonstrated ownership of technical implementation",
                        "Structured root-cause diagnosis",
                        "Measurable business or technical outcome achieved"
                    ],
                    "context_source": f"Candidate Resume Project: {proj_name}"
                })
            else:
                questions.append({
                    "category": "Project-Based",
                    "difficulty": difficulty,
                    "question": f"Describe the most complex software system you contributed to from conception to deployment, focusing on your specific architectural decisions.",
                    "expected_answer_summary": "Explanation of architecture, API contracts, deployment pipeline, and post-launch monitoring.",
                    "evaluation_criteria": [
                        "Clarity of individual contribution",
                        "End-to-end SDLC awareness"
                    ],
                    "context_source": "General project experience"
                })

        # 4. Problem-Solving Questions
        if "Problem-Solving" in requested_cats:
            questions.append({
                "category": "Problem-Solving",
                "difficulty": difficulty,
                "question": "A mission-critical API endpoint suddenly begins experiencing intermittent p99 latency spikes of 5+ seconds under moderate traffic. How do you isolate and mitigate the issue?",
                "expected_answer_summary": "Structured triage: inspect distributed APM traces, check database slow queries and locks, verify connection pools and memory/CPU limits, apply circuit breakers or caching if needed.",
                "evaluation_criteria": [
                    "Methodical debugging approach from edge to database",
                    "Effective usage of APM/metrics/logs",
                    "Immediate mitigation strategies vs long-term preventative fixes"
                ],
                "context_source": "Engineering incident resolution scenario"
            })

        return questions

interview_generator = InterviewGenerator()

