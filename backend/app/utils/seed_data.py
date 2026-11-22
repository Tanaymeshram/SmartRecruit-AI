import uuid
from datetime import datetime, timezone
from backend.app.core.security import get_password_hash
from backend.app.database.mongodb import get_db
from backend.app.ai.rag.engine import rag_engine

DEMO_COMPANY_ID = "company-demo-techcorp-101"
DEMO_USER_ID = "user-demo-recruiter-001"

async def seed_database_if_empty():
    db = get_db()
    existing_user = await db["users"].find_one({"email": "recruiter@techcorp.com"})
    if existing_user:
        # Re-populate in-memory RAG index if empty
        if len(rag_engine.chunks_db) == 0:
            candidates = await db["candidates"].find({"company_id": DEMO_COMPANY_ID})
            for c in candidates:
                rag_engine.ingest_document(
                    document_id=str(c["_id"]),
                    title=f"Resume - {c.get('full_name')}",
                    text=c.get("resume_text", c.get("summary", "")),
                    company_id=DEMO_COMPANY_ID,
                    scope="resumes",
                    candidate_id=str(c["_id"]),
                    candidate_name=c.get("full_name")
                )
            docs = await db["documents"].find({"company_id": DEMO_COMPANY_ID})
            for d in docs:
                rag_engine.ingest_document(
                    document_id=str(d["_id"]),
                    title=d.get("title", "Document"),
                    text=d.get("text", ""),
                    company_id=DEMO_COMPANY_ID,
                    scope="company_knowledge"
                )
        return  # already seeded in db

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Company
    await db["companies"].insert_one({
        "_id": DEMO_COMPANY_ID,
        "name": "TechCorp AI Solutions",
        "industry": "Artificial Intelligence & Cloud Software",
        "created_at": now_iso
    })

    # 2. Recruiter User
    await db["users"].insert_one({
        "_id": DEMO_USER_ID,
        "email": "recruiter@techcorp.com",
        "full_name": "Sarah Jenkins",
        "hashed_password": get_password_hash("Recruiter123!"),
        "role": "recruiter",
        "company_id": DEMO_COMPANY_ID,
        "company_name": "TechCorp AI Solutions",
        "created_at": now_iso,
        "updated_at": now_iso
    })

    # 3. Jobs
    jobs_data = [
        {
            "_id": "job-001",
            "company_id": DEMO_COMPANY_ID,
            "creator_id": DEMO_USER_ID,
            "title": "Senior Full-Stack AI Engineer",
            "department": "Engineering",
            "location": "San Francisco, CA (Hybrid / Remote)",
            "job_type": "Full-time",
            "experience_required_years": 4.0,
            "education_required": "Bachelor's or Master's in Computer Science",
            "description": "TechCorp is seeking a Senior Full-Stack AI Engineer to spearhead our intelligent enterprise automation platform. You will build high-throughput FastAPI microservices, craft responsive React user interfaces, and deploy state-of-the-art LLM/RAG pipelines with ChromaDB and PyTorch.",
            "required_skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "PostgreSQL"],
            "preferred_skills": ["PyTorch", "LangChain", "RAG", "ChromaDB", "Kubernetes"],
            "status": "open",
            "applications_count": 3,
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "job-002",
            "company_id": DEMO_COMPANY_ID,
            "creator_id": DEMO_USER_ID,
            "title": "Lead Frontend UI/UX Architect",
            "department": "Design & Engineering",
            "location": "Remote",
            "job_type": "Full-time",
            "experience_required_years": 5.0,
            "education_required": "Bachelor's in CS, Design or equivalent",
            "description": "We are looking for an exceptional Lead Frontend Engineer to guide web client architecture, establish design systems with Tailwind CSS, and build accessible, responsive React & Next.js applications.",
            "required_skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "JavaScript"],
            "preferred_skills": ["Redux", "GraphQL", "Jest", "CI/CD"],
            "status": "open",
            "applications_count": 2,
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "job-003",
            "company_id": DEMO_COMPANY_ID,
            "creator_id": DEMO_USER_ID,
            "title": "Cloud DevOps & Platform Engineer",
            "department": "Infrastructure",
            "location": "New York, NY (Hybrid)",
            "job_type": "Full-time",
            "experience_required_years": 3.5,
            "education_required": "Bachelor's Degree in CS/IT",
            "description": "Drive cloud infrastructure reliability, multi-region Kubernetes clusters, automated Terraform pipelines, and observability monitoring across AWS services.",
            "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
            "preferred_skills": ["Prometheus", "Grafana", "Python", "Nginx"],
            "status": "open",
            "applications_count": 2,
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "job-004",
            "company_id": DEMO_COMPANY_ID,
            "creator_id": DEMO_USER_ID,
            "title": "Machine Learning / NLP Research Engineer",
            "department": "AI Research",
            "location": "Remote",
            "job_type": "Full-time",
            "experience_required_years": 3.0,
            "education_required": "Master's or PhD in AI, NLP or Computer Science",
            "description": "Design, fine-tune, and evaluate transformer models, embeddings, retrieval-augmented generation systems, and semantic rerankers for enterprise search.",
            "required_skills": ["Python", "PyTorch", "NLP", "Machine Learning", "Transformers", "Scikit-Learn"],
            "preferred_skills": ["Hugging Face", "LangChain", "RAG", "Vector Databases"],
            "status": "open",
            "applications_count": 2,
            "created_at": now_iso,
            "updated_at": now_iso
        }
    ]
    for j in jobs_data:
        await db["jobs"].insert_one(j)

    # 4. Synthetic Candidates
    candidates_data = [
        {
            "_id": "cand-001",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "Alex Rivera",
            "email": "alex.rivera@example.com",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
            "linkedin": "https://linkedin.com/in/alex-rivera-dev",
            "github": "https://github.com/alexrivera-ai",
            "total_experience_years": 5.5,
            "summary": "Full-stack AI engineer with 5.5 years designing cloud microservices in FastAPI, building interactive React & TypeScript web portals, and implementing production RAG workflows using PyTorch, LangChain, and ChromaDB.",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "Docker", "PostgreSQL", "PyTorch", "LangChain", "RAG", "ChromaDB", "Git", "REST APIs"],
            "skills_by_category": {
                "Programming Languages": ["Python", "TypeScript", "JavaScript", "SQL"],
                "Frameworks & Libraries": ["FastAPI", "React", "REST APIs"],
                "AI, Machine Learning & Data": ["PyTorch", "LangChain", "RAG", "ChromaDB"],
                "Cloud & DevOps": ["Docker", "Git"],
                "Databases & Storage": ["PostgreSQL"]
            },
            "experiences": [
                {
                    "title": "Senior AI Systems Developer",
                    "company": "Cognitive Scale Labs",
                    "duration": "2022 - Present",
                    "description": "Architected low-latency FastAPI inference gateway serving 5M daily requests. Engineered RAG vector pipelines with ChromaDB embeddings and custom reranking heuristics."
                },
                {
                    "title": "Full-Stack Software Engineer",
                    "company": "Vanguard Web Technologies",
                    "duration": "2019 - 2022",
                    "description": "Developed React dashboard applications with modular state architectures. Implemented PostgreSQL schema migrations and containerized deployment with Docker."
                }
            ],
            "educations": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "University of California, Berkeley",
                    "year": "2019"
                }
            ],
            "projects": [
                {
                    "name": "IntelliDoc Enterprise RAG",
                    "description": "Built an open-source hybrid search engine combining BM25 lexical retrieval and dense embeddings for complex legal and technical PDF parsing.",
                    "technologies": ["Python", "FastAPI", "ChromaDB", "React"]
                }
            ],
            "certifications": ["AWS Certified Solutions Architect Associate", "Deep Learning Specialization"],
            "status": "interviewing",
            "applied_job_ids": ["job-001", "job-004"],
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "cand-002",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "Elena Rostova",
            "email": "elena.rostova@example.com",
            "phone": "+1 (555) 345-6789",
            "location": "Seattle, WA",
            "linkedin": "https://linkedin.com/in/elena-rostova-ui",
            "github": "https://github.com/erostova",
            "total_experience_years": 6.0,
            "summary": "Accomplished Frontend Architect with 6 years creating scalable React, Next.js, and TypeScript web platforms. Passionate about micro-frontends, accessible component libraries, and Tailwind CSS design systems.",
            "skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Next.js", "Redux", "GraphQL", "Jest", "HTML", "CSS", "REST APIs"],
            "skills_by_category": {
                "Programming Languages": ["TypeScript", "JavaScript", "HTML", "CSS"],
                "Frameworks & Libraries": ["React", "Next.js", "Redux", "Tailwind CSS", "GraphQL"],
                "Software Engineering & Tools": ["Jest", "Git"]
            },
            "experiences": [
                {
                    "title": "Staff Frontend Engineer",
                    "company": "Aura Design Systems",
                    "duration": "2021 - Present",
                    "description": "Led team of 8 engineers refactoring monolithic frontend into modular Next.js application, boosting Core Web Vitals performance by 40%."
                }
            ],
            "educations": [
                {
                    "degree": "B.S. in Software Engineering",
                    "institution": "University of Washington",
                    "year": "2018"
                }
            ],
            "projects": [
                {
                    "name": "DesignSystem Studio",
                    "description": "Created headless UI component system used across 12 SaaS enterprise products.",
                    "technologies": ["React", "Tailwind CSS", "TypeScript"]
                }
            ],
            "certifications": ["Meta Certified Front-End Developer"],
            "status": "screened",
            "applied_job_ids": ["job-002"],
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "cand-003",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "Marcus Chen",
            "email": "marcus.chen@example.com",
            "phone": "+1 (555) 456-7890",
            "location": "Austin, TX",
            "linkedin": "https://linkedin.com/in/marcus-chen-cloud",
            "github": "https://github.com/marcuschen-ops",
            "total_experience_years": 4.5,
            "summary": "Site reliability and DevOps engineer specializing in infrastructure as code using Terraform, Kubernetes cluster operations, Docker container security, and AWS cost optimization.",
            "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Python", "Nginx", "GitHub Actions", "Prometheus"],
            "skills_by_category": {
                "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "GitHub Actions", "Prometheus"],
                "Programming Languages": ["Python", "Bash"]
            },
            "experiences": [
                {
                    "title": "Senior DevOps Engineer",
                    "company": "CloudStream Networks",
                    "duration": "2021 - Present",
                    "description": "Managed 14 Kubernetes clusters on AWS EKS with zero-downtime blue/green deployments and automated Terraform provisioning."
                }
            ],
            "educations": [
                {
                    "degree": "B.S. in Information Systems",
                    "institution": "University of Texas at Austin",
                    "year": "2020"
                }
            ],
            "projects": [
                {
                    "name": "KubeGuard Helm Automation",
                    "description": "Automated security policy enforcement and pod auto-scaling profiles.",
                    "technologies": ["Kubernetes", "Docker", "Terraform"]
                }
            ],
            "certifications": ["CKA - Certified Kubernetes Administrator", "AWS Solutions Architect Professional"],
            "status": "new",
            "applied_job_ids": ["job-003"],
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "cand-004",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "Dr. Priya Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+1 (555) 567-8901",
            "location": "Boston, MA",
            "linkedin": "https://linkedin.com/in/priya-sharma-nlp",
            "github": "https://github.com/priyasharma-nlp",
            "total_experience_years": 4.0,
            "summary": "Machine learning researcher and NLP engineer with expertise in transformer fine-tuning, dense vector representations, BM25 hybrid search, and LangChain orchestration.",
            "skills": ["Python", "PyTorch", "NLP", "Machine Learning", "Transformers", "Scikit-Learn", "Hugging Face", "LangChain", "RAG", "spaCy", "Pandas", "NumPy"],
            "skills_by_category": {
                "Programming Languages": ["Python"],
                "AI, Machine Learning & Data": ["PyTorch", "NLP", "Machine Learning", "Transformers", "Hugging Face", "LangChain", "RAG", "Scikit-Learn", "spaCy", "Pandas", "NumPy"]
            },
            "experiences": [
                {
                    "title": "Machine Learning Specialist",
                    "company": "NeuralInsight Research",
                    "duration": "2021 - Present",
                    "description": "Trained custom domain-adapted embeddings for medical information retrieval with 92% NDCG@10."
                }
            ],
            "educations": [
                {
                    "degree": "Ph.D. in Computer Science (NLP)",
                    "institution": "Carnegie Mellon University",
                    "year": "2021"
                }
            ],
            "projects": [
                {
                    "name": "BioSemantic Search",
                    "description": "Built PubMed RAG question answering engine with verified citations.",
                    "technologies": ["Python", "PyTorch", "Transformers", "Hugging Face"]
                }
            ],
            "certifications": ["TensorFlow Developer Certificate"],
            "status": "offered",
            "applied_job_ids": ["job-004", "job-001"],
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "cand-005",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "David Kim",
            "email": "david.kim@example.com",
            "phone": "+1 (555) 678-9012",
            "location": "Chicago, IL",
            "linkedin": "https://linkedin.com/in/david-kim-web",
            "github": "https://github.com/davidkim-dev",
            "total_experience_years": 1.5,
            "summary": "Junior web developer with experience building JavaScript and React frontends, Node.js and Express REST services, and MongoDB database models.",
            "skills": ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "HTML", "CSS", "Git"],
            "skills_by_category": {
                "Programming Languages": ["JavaScript", "HTML", "CSS"],
                "Frameworks & Libraries": ["React", "Node.js", "Express.js"],
                "Databases & Storage": ["MongoDB"]
            },
            "experiences": [
                {
                    "title": "Junior Web Developer",
                    "company": "Nexus Digital Studio",
                    "duration": "2023 - Present",
                    "description": "Assisted in building client dashboard portals and Node.js backend integrations."
                }
            ],
            "educations": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "University of Illinois Urbana-Champaign",
                    "year": "2023"
                }
            ],
            "projects": [
                {
                    "name": "TaskFlow Web App",
                    "description": "Kanban board application built with React and MongoDB.",
                    "technologies": ["React", "Node.js", "MongoDB"]
                }
            ],
            "certifications": [],
            "status": "new",
            "applied_job_ids": ["job-002"],
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "_id": "cand-006",
            "company_id": DEMO_COMPANY_ID,
            "full_name": "Sofia Alvarez",
            "email": "sofia.alvarez@example.com",
            "phone": "+1 (555) 789-0123",
            "location": "Denver, CO",
            "linkedin": "https://linkedin.com/in/sofia-alvarez-backend",
            "github": "https://github.com/sofiaalvarez",
            "total_experience_years": 3.5,
            "summary": "Backend Python developer proficient in Django, PostgreSQL, Redis caching, REST API contracts, and Docker microservices.",
            "skills": ["Python", "Django", "PostgreSQL", "Redis", "Docker", "REST APIs", "Git", "Linux"],
            "skills_by_category": {
                "Programming Languages": ["Python", "SQL"],
                "Frameworks & Libraries": ["Django", "REST APIs"],
                "Databases & Storage": ["PostgreSQL", "Redis"],
                "Cloud & DevOps": ["Docker", "Linux"]
            },
            "experiences": [
                {
                    "title": "Backend Software Developer",
                    "company": "Apex Fintech Solutions",
                    "duration": "2022 - Present",
                    "description": "Designed transaction ledger APIs handling 50k transactions/hour using Django and PostgreSQL with Redis caching."
                }
            ],
            "educations": [
                {
                    "degree": "B.S. in Computer Engineering",
                    "institution": "University of Colorado Boulder",
                    "year": "2021"
                }
            ],
            "projects": [
                {
                    "name": "PayStream Ledger Engine",
                    "description": "Double-entry bookkeeping service with Redis lock protection.",
                    "technologies": ["Python", "Django", "PostgreSQL", "Redis"]
                }
            ],
            "certifications": [],
            "status": "screened",
            "applied_job_ids": ["job-001"],
            "created_at": now_iso,
            "updated_at": now_iso
        }
    ]

    for c in candidates_data:
        c["resume_text"] = f"{c['full_name']} Resume\nEmail: {c['email']} Phone: {c['phone']}\nSummary: {c['summary']}\nSkills: {', '.join(c['skills'])}\nExperience: {c['experiences'][0]['title']} at {c['experiences'][0]['company']}. {c['experiences'][0]['description']}\nEducation: {c['educations'][0]['degree']} from {c['educations'][0]['institution']}"
        await db["candidates"].insert_one(c)

        # Ingest candidate resume into RAG vector engine
        rag_engine.ingest_document(
            document_id=c["_id"],
            title=f"Resume - {c['full_name']}",
            text=c["resume_text"],
            company_id=DEMO_COMPANY_ID,
            scope="resumes",
            candidate_id=c["_id"],
            candidate_name=c["full_name"],
            sections={
                "Summary": c["summary"],
                "Skills": ", ".join(c["skills"]),
                "Experience": f"{c['experiences'][0]['title']} at {c['experiences'][0]['company']}. {c['experiences'][0]['description']}",
                "Education": f"{c['educations'][0]['degree']} from {c['educations'][0]['institution']}"
            }
        )

    # 5. Company Knowledge Documents
    doc1_text = """
TechCorp AI Engineering Hiring Policy & Evaluation Guidelines (2026)
Overview:
All technical roles at TechCorp adhere to structured, objective interview processes to ensure equal opportunity and rigorous engineering standards.

Evaluation Criteria:
1. Core Technical Competency (40% weight): Depth in required programming languages, system design capabilities, and testing discipline.
2. Problem Solving & Architectural Thinking (30% weight): Ability to break down ambiguous business requirements into scalable, decoupled software components.
3. Collaborative Engineering & Ownership (20% weight): Clear communication, code review hygiene, and empathy in teamwork.
4. Continuous Upskilling (10% weight): Willingness to adopt emerging tools including AI-assisted development and modern DevOps practices.

Non-Discrimination & Equal Opportunity Mandate:
Candidate evaluations must never consider age, gender, race, religion, sexual orientation, disability, or marital status. Ranking algorithms must evaluate purely technical and professional job-related evidence. Automatic rejection by automated systems is strictly forbidden; final screening and hiring decisions remain solely with designated human hiring committees.
"""
    await db["documents"].insert_one({
        "_id": "doc-001",
        "company_id": DEMO_COMPANY_ID,
        "title": "TechCorp Engineering Hiring Policy (2026)",
        "doc_type": "policy",
        "filename": "TechCorp_Hiring_Policy_2026.pdf",
        "text": doc1_text,
        "created_at": now_iso
    })
    rag_engine.ingest_document(
        document_id="doc-001",
        title="TechCorp Engineering Hiring Policy (2026)",
        text=doc1_text,
        company_id=DEMO_COMPANY_ID,
        scope="company_knowledge"
    )

    doc2_text = """
TechCorp Technical Interviewer Standard Operating Procedure (SOP)
Interview Phases:
Stage 1: Asynchronous Resume & Portfolio Review by Lead Recruiter.
Stage 2: 45-Minute Live System Architecture & Coding Screen.
Stage 3: Deep-Dive Project Discussion based on candidate's verified GitHub/resume projects.
Stage 4: Cross-Functional Team & Cultural Add Evaluation.

Guidelines for Technical Evaluators:
- Frame problem-solving questions around real-world scenarios rather than obscure algorithmic trivia.
- Give candidates opportunities to explain unexpected engineering roadblocks they solved in past projects.
- Record structured notes and clear evidence for every rubric score before submitting candidate feedback.
"""
    await db["documents"].insert_one({
        "_id": "doc-002",
        "company_id": DEMO_COMPANY_ID,
        "title": "Technical Interviewer SOP & Guidelines",
        "doc_type": "interview_guideline",
        "filename": "Interviewer_SOP_Guidelines.docx",
        "text": doc2_text,
        "created_at": now_iso
    })
    rag_engine.ingest_document(
        document_id="doc-002",
        title="Technical Interviewer SOP & Guidelines",
        text=doc2_text,
        company_id=DEMO_COMPANY_ID,
        scope="company_knowledge"
    )

    # 6. Initial Activities
    await db["activities"].insert_one({
        "_id": str(uuid.uuid4()),
        "company_id": DEMO_COMPANY_ID,
        "user_name": "Sarah Jenkins",
        "action": "Seeded demo dataset with 4 jobs, 6 candidates, and 2 HR knowledge documents",
        "type": "system",
        "created_at": now_iso
    })

