import re
from typing import List, Dict, Set, Tuple
from backend.app.ai.skill_extractor.taxonomy import SKILL_TAXONOMY, SKILL_ALIASES, SKILL_RELATIONS

class SkillExtractor:
    """Robust, boundary-aware multi-phrase skill extraction engine."""

    def __init__(self):
        self.all_canonical_skills: Set[str] = set()
        self.skill_to_category: Dict[str, str] = {}
        
        for category, skills in SKILL_TAXONOMY.items():
            for skill in skills:
                self.all_canonical_skills.add(skill)
                self.skill_to_category[skill] = category

    def extract_skills(self, text: str) -> List[str]:
        """Extract all identifiable canonical skills from raw text."""
        if not text:
            return []

        found_skills: Set[str] = set()
        text_lower = text.lower()

        # Check aliases first
        for alias, canonical in SKILL_ALIASES.items():
            pattern = r'(?<![a-zA-Z0-9_-])' + re.escape(alias) + r'(?![a-zA-Z0-9_-])'
            if re.search(pattern, text_lower):
                found_skills.add(canonical)

        # Check all canonical skills
        for skill in self.all_canonical_skills:
            pattern = r'(?<![a-zA-Z0-9_#+])' + re.escape(skill.lower()) + r'(?![a-zA-Z0-9_#+])'
            # Special case for C++, C#
            if skill == "C++":
                if re.search(r'(?<![a-zA-Z0-9_])c\+\+(?![a-zA-Z0-9_])', text_lower):
                    found_skills.add(skill)
            elif skill == "C#":
                if re.search(r'(?<![a-zA-Z0-9_])c#(?![a-zA-Z0-9_])', text_lower):
                    found_skills.add(skill)
            elif skill == "C":
                if re.search(r'\b(c\s+programming|language\s+c|c\s+developer)\b', text_lower):
                    found_skills.add(skill)
            elif skill == "Go":
                if re.search(r'\b(golang|go\s+programming|go\s+developer|language\s+go)\b', text_lower):
                    found_skills.add(skill)
            elif skill == "R":
                if re.search(r'\b(r\s+programming|r\s+language|r\s+studio)\b', text_lower):
                    found_skills.add(skill)
            else:
                if re.search(pattern, text_lower):
                    found_skills.add(skill)

        # Sort alphabetically for consistency
        return sorted(list(found_skills))

    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Group a list of skills into structured categories."""
        categorized: Dict[str, List[str]] = {}
        for skill in skills:
            cat = self.skill_to_category.get(skill, "Other Skills")
            categorized.setdefault(cat, []).append(skill)
        return categorized

    def get_related_skills(self, skills: List[str]) -> List[str]:
        """Infer related skills that complement the candidate's existing stack."""
        related = set()
        skill_set = set(skills)
        for skill in skills:
            for rel in SKILL_RELATIONS.get(skill, []):
                if rel not in skill_set:
                    related.add(rel)
        return sorted(list(related))

skill_extractor = SkillExtractor()
