import re

from services.matcher import calculate_similarity
from services.skill_extractor import extract_skills
from services.skill_matcher import match_skills
from services.candidate_extractor import extract_candidate_details


def get_required_experience(experience_text):

    if not experience_text:
        return None

    match = re.search(
        r'(\d+(?:\.\d+)?)\s*\+?\s*years?',
        experience_text,
        re.IGNORECASE
    )

    if match:
        return float(match.group(1))

    return None


def screen_candidate(resume_text: str, job):

    # Extract candidate information
    candidate_details = extract_candidate_details(resume_text)

    # Extract skills
    resume_skills = extract_skills(resume_text)

    # Get job requirements
    required_skills = job.required_skills
    preferred_skills = job.preferred_skills

    job_description = job.job_description or ""

    # Calculate semantic similarity
    semantic_score = calculate_similarity(
        resume_text,
        job_description
    )

    # Match skills
    skill_result = match_skills(
        resume_skills,
        required_skills,
        preferred_skills
    )

    # Required skills score
    if required_skills:
        required_score = (
            len(skill_result["matched_required"])
            / len(required_skills)
        ) * 100
    else:
        required_score = 100

    # Preferred skills score
    if preferred_skills:
        preferred_score = (
            len(skill_result["matched_preferred"])
            / len(preferred_skills)
        ) * 100
    else:
        preferred_score = 100

    # Experience matching
    required_experience = get_required_experience(
        job.experience
    )

    candidate_experience = candidate_details["experience_years"]

    if required_experience is None:
        experience_score = 100

    elif candidate_experience >= required_experience:
        experience_score = 100

    else:
        experience_score = (
            candidate_experience / required_experience
        ) * 100

    # Final weighted score
    final_score = (
        semantic_score * 0.45
        + required_score * 0.35
        + preferred_score * 0.10
        + experience_score * 0.10
    )

    final_score = round(final_score, 2)

    return {
        "candidate_details": candidate_details,
        "final_score": final_score,
        "semantic_score": round(semantic_score, 2),
        "required_skill_score": round(required_score, 2),
        "preferred_skill_score": round(preferred_score, 2),
        "experience_score": round(experience_score, 2),
        "resume_skills": resume_skills,
        "matched_required": skill_result["matched_required"],
        "missing_required": skill_result["missing_required"],
        "matched_preferred": skill_result["matched_preferred"],
        "missing_preferred": skill_result["missing_preferred"]
    }