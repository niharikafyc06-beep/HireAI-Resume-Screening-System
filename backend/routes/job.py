from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter(
    prefix="/job",
    tags=["Job Requirements"]
)


class JobRequirement(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: List[str] = []
    experience: str = ""
    job_description: str = ""


current_job = None


@router.post("/create")
def create_job(job: JobRequirement):

    global current_job

    current_job = job

    return {
        "message": "Job created successfully",
        "job": job
    }


@router.get("/current")
def get_current_job():

    if current_job is None:
        return {
            "message": "No job has been created yet"
        }

    return {
        "job": current_job
    }