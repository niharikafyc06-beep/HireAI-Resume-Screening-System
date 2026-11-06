
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session

from database import get_db
from models import Job
from routes.auth import get_current_user


router = APIRouter(
    prefix="/job",
    tags=["Job Requirements"]
)


class JobRequirement(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: List[str] = Field(default_factory=list)
    experience: str = ""
    job_description: str = ""


@router.post("/create")
def create_job(
    job: JobRequirement,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_job = Job(
        title=job.job_title,
        description=job.job_description,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        experience=job.experience,
        company_id=current_user.company_id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "message": "Job created successfully",
        "job_id": new_job.id,
        "job": {
            "job_title": new_job.title,
            "required_skills": new_job.required_skills,
            "preferred_skills": new_job.preferred_skills,
            "experience": new_job.experience,
            "job_description": new_job.description
        }
    }


@router.get("/current")
def get_current_job(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    jobs = db.query(Job).filter(
        Job.company_id == current_user.company_id
    ).order_by(Job.id.desc()).all()

    if not jobs:
        return {
            "message": "No job has been created yet"
        }

    return {
        "jobs": [
            {
                "job_id": job.id,
                "job_title": job.title,
                "required_skills": job.required_skills,
                "preferred_skills": job.preferred_skills,
                "experience": job.experience,
                "job_description": job.description
            }
            for job in jobs
        ]
    }
