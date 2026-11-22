import pytest
from backend.app.ai.skill_extractor.extractor import skill_extractor
from backend.app.ai.resume_parser.parser import resume_parser

def test_skill_extraction_and_aliases():
    sample_text = """
    Senior Software Engineer with 6 years experience in Python, FastAPI, React.js, and PostgreSQL.
    Proficient with K8s cluster deployments, Docker containers, PyTorch deep learning models,
    and building RAG applications with ChromaDB and LangChain.
    """
    skills = skill_extractor.extract_skills(sample_text)
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "React" in skills  # Normalized from React.js
    assert "PostgreSQL" in skills
    assert "Kubernetes" in skills  # Normalized from K8s
    assert "PyTorch" in skills
    assert "RAG" in skills

    categories = skill_extractor.categorize_skills(skills)
    assert "Programming Languages" in categories
    assert "Frameworks & Libraries" in categories

def test_resume_parser_contact_and_years():
    sample_resume = """
    Alex Rivera
    alex.rivera@example.com | +1 555-234-5678 | linkedin.com/in/alex-rivera-dev
    
    Professional Summary
    Experienced Full-Stack AI Engineer with 5+ years of experience in Python and React.
    
    Work Experience
    Senior AI Developer - Cognitive Scale Labs (2021 - Present)
    Developed low-latency FastAPI inference gateway and RAG pipelines.
    
    Education
    Bachelor of Science in Computer Science - UC Berkeley
    """
    contact = resume_parser.extract_contact_info(sample_resume)
    assert contact["email"] == "alex.rivera@example.com"
    assert "555" in (contact["phone"] or "")
    assert "linkedin.com/in/alex-rivera-dev" in (contact["linkedin"] or "")

    years = resume_parser.estimate_experience_years(sample_resume)
    assert years >= 5.0

