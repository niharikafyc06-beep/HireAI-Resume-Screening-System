ALIASES = {
    "js": "javascript",
    "nodejs": "node.js",
    "node js": "node.js",
    "reactjs": "react",
    "react.js": "react",
    "ml": "machine learning",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "postgres": "postgresql",
    "cpp": "c++",
    "amazon web services": "aws"
}


def normalize_skill(skill: str) -> str:

    skill = skill.strip().lower()

    return ALIASES.get(skill, skill)


def match_skills(resume_skills, required_skills, preferred_skills):

    resume_skills_normalized = {
        normalize_skill(skill)
        for skill in resume_skills
    }

    matched_required = [
        skill for skill in required_skills
        if normalize_skill(skill) in resume_skills_normalized
    ]

    missing_required = [
        skill for skill in required_skills
        if normalize_skill(skill) not in resume_skills_normalized
    ]

    matched_preferred = [
        skill for skill in preferred_skills
        if normalize_skill(skill) in resume_skills_normalized
    ]

    missing_preferred = [
        skill for skill in preferred_skills
        if normalize_skill(skill) not in resume_skills_normalized
    ]

    return {
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred
    }