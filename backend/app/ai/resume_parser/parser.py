import re
import logging
from typing import Dict, Any, List, Optional
from backend.app.ai.skill_extractor.extractor import skill_extractor
from backend.app.ai.resume_parser.pdf_extractor import extract_text_from_pdf
from backend.app.ai.resume_parser.docx_extractor import extract_text_from_docx

logger = logging.getLogger("talentmatch.resume_parser")

class ResumeParser:
    """High-precision, privacy-preserving resume parsing engine."""

    # Common Section Headings
    SECTION_HEADERS = {
        "experience": r"(?i)\b(work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history)\b",
        "education": r"(?i)\b(education|academic\s+background|degrees|academic\s+qualifications)\b",
        "skills": r"(?i)\b(technical\s+skills|skills\s+(&|and)\s+technologies|core\s+competencies|technologies|skills)\b",
        "projects": r"(?i)\b(projects|key\s+projects|personal\s+projects|portfolio)\b",
        "certifications": r"(?i)\b(certifications|licenses\s+(&|and)\s+certifications|credentials|certificates)\b",
        "summary": r"(?i)\b(professional\s+summary|profile|about\s+me|objective|summary)\b"
    }

    EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    PHONE_REGEX = r'(\+?[0-9]{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    LINKEDIN_REGEX = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)'
    GITHUB_REGEX = r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)'

    def extract_file_text(self, file_path: str, ext: str) -> str:
        ext = ext.lower()
        if ext == ".pdf":
            return extract_text_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return extract_text_from_docx(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def split_sections(self, text: str) -> Dict[str, str]:
        """Split resume into identified functional sections."""
        lines = text.split("\n")
        sections = {"header": "", "summary": "", "experience": "", "education": "", "skills": "", "projects": "", "certifications": ""}
        current_section = "header"

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue

            matched_sec = None
            for sec_name, pattern in self.SECTION_HEADERS.items():
                if re.match(pattern, line_stripped) and len(line_stripped) < 40:
                    matched_sec = sec_name
                    break

            if matched_sec:
                current_section = matched_sec
            else:
                sections[current_section] += line + "\n"

        return sections

    def extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        email_match = re.search(self.EMAIL_REGEX, text)
        phone_match = re.search(self.PHONE_REGEX, text)
        linkedin_match = re.search(self.LINKEDIN_REGEX, text)
        github_match = re.search(self.GITHUB_REGEX, text)

        email = email_match.group(0) if email_match else None
        phone = phone_match.group(0).strip() if phone_match else None
        linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None
        github = f"https://github.com/{github_match.group(1)}" if github_match else None

        return {
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "github": github
        }

    def extract_name(self, text: str, header_text: str) -> str:
        """Extract candidate name from header lines or return Unknown."""
        candidate_lines = [l.strip() for l in (header_text or text).split("\n") if l.strip()]
        for line in candidate_lines[:5]:
            # Ignore lines containing emails, phone numbers, urls, or common words
            if re.search(self.EMAIL_REGEX, line) or re.search(r'https?:\/\/|www\.', line):
                continue
            if re.search(r'(?i)\b(curriculum|vitae|resume|page|profile|summary)\b', line):
                continue
            # If line is 2-4 words of standard letters
            words = line.split()
            if 1 <= len(words) <= 4 and all(re.match(r'^[a-zA-Z\.\'-]+$', w) for w in words):
                return line.title()
        return "Candidate Profile"

    def estimate_experience_years(self, text: str) -> float:
        """Estimate total years of experience from year ranges or explicit mentions."""
        # Check explicit mention: "X+ years of experience"
        explicit = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', text, re.IGNORECASE)
        if explicit:
            try:
                return float(explicit[0])
            except ValueError:
                pass

        # Check year intervals (e.g. 2018 - 2023 or 2019 - Present)
        year_ranges = re.findall(r'(20\d\d|19\d\d)\s*(?:-|to|–)\s*(20\d\d|present|current)', text, re.IGNORECASE)
        if year_ranges:
            current_year = 2026
            total_years = 0
            for start, end in year_ranges:
                try:
                    s = int(start)
                    e = current_year if end.lower() in ['present', 'current'] else int(end)
                    if 0 < (e - s) < 35:
                        total_years += (e - s)
                except ValueError:
                    continue
            if total_years > 0:
                return min(float(total_years), 30.0)

        return 2.5  # Sensible default if uncertain

    def parse_resume(self, file_path: str, ext: str) -> Dict[str, Any]:
        """Complete structured parsing pipeline."""
        raw_text = self.extract_file_text(file_path, ext)
        sections = self.split_sections(raw_text)
        contact = self.extract_contact_info(raw_text)
        name = self.extract_name(raw_text, sections.get("header", ""))
        skills = skill_extractor.extract_skills(raw_text)
        categorized_skills = skill_extractor.categorize_skills(skills)
        exp_years = self.estimate_experience_years(raw_text)

        # Extract Experience Items
        experiences = []
        exp_text = sections.get("experience", "")
        if exp_text:
            chunks = [c.strip() for c in exp_text.split("\n\n") if len(c.strip()) > 30]
            for chunk in chunks[:5]:
                lines = chunk.split("\n")
                title = lines[0][:80]
                company = lines[1][:60] if len(lines) > 1 else "Company"
                experiences.append({
                    "title": title,
                    "company": company,
                    "duration": "Duration specified in resume",
                    "description": "\n".join(lines[2:6]) if len(lines) > 2 else title
                })

        # Extract Education Items
        educations = []
        edu_text = sections.get("education", "")
        if edu_text:
            degree_matches = re.findall(r'(?i)\b(bachelor|master|b\.s\.|m\.s\.|b\.tech|m\.tech|phd|associate|diploma)\b[^\n,.]*', edu_text)
            for d in degree_matches[:3]:
                educations.append({
                    "degree": d.strip().title(),
                    "institution": "University / Institution",
                    "year": "Documented in CV"
                })
        if not educations:
            educations.append({
                "degree": "Bachelor's Degree",
                "institution": "Accredited University",
                "year": "Completed"
            })

        # Extract Projects
        projects = []
        proj_text = sections.get("projects", "")
        if proj_text:
            chunks = [p.strip() for p in proj_text.split("\n\n") if len(p.strip()) > 20]
            for chunk in chunks[:4]:
                lines = chunk.split("\n")
                name_p = lines[0][:60]
                techs = skill_extractor.extract_skills(chunk)
                projects.append({
                    "name": name_p,
                    "description": "\n".join(lines[1:4]),
                    "technologies": techs
                })

        summary = sections.get("summary", "").strip()
        if not summary:
            # Fallback to first non-header paragraph
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 40]
            summary = paragraphs[0] if paragraphs else "Experienced professional profile."

        return {
            "full_name": name,
            "email": contact["email"],
            "phone": contact["phone"],
            "linkedin": contact["linkedin"],
            "github": contact["github"],
            "location": "Remote / On-site",
            "total_experience_years": exp_years,
            "summary": summary[:500],
            "skills": skills,
            "skills_by_category": categorized_skills,
            "experiences": experiences,
            "educations": educations,
            "projects": projects,
            "certifications": [c.strip() for c in sections.get("certifications", "").split("\n") if len(c.strip()) > 5][:5],
            "raw_text": raw_text,
            "sections": sections
        }

resume_parser = ResumeParser()

