from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Annotated
import os
import shutil
import uuid

from services.pdf_parser import extract_text_from_pdf
from services.screening import screen_candidate
from routes import job


router = APIRouter(
    prefix="/screening",
    tags=["Candidate Screening"]
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -----------------------------------------
# 1. Analyze a single candidate
# -----------------------------------------

@router.post("/analyze")
async def analyze_candidate(file: UploadFile = File(...)):

    if job.current_job is None:
        raise HTTPException(
            status_code=400,
            detail="Please create a job before analyzing candidates."
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    safe_filename = (
        f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
    )

    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(file_path)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF."
            )

        result = screen_candidate(
            resume_text,
            job.current_job
        )

        return {
            "candidate": file.filename,
            "analysis": result
        }

    finally:
        await file.close()


# -----------------------------------------
# 2. Rank multiple candidates
# -----------------------------------------

@router.post("/rank")
async def rank_candidates(
    files: Annotated[
        list[UploadFile],
        File(description="Upload multiple PDF resumes")
    ]
):

    if job.current_job is None:
        raise HTTPException(
            status_code=400,
            detail="Please create a job before ranking candidates."
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one PDF resume."
        )

    candidates = []

    for file in files:

        try:
            if not file.filename or not file.filename.lower().endswith(".pdf"):
                continue

            safe_filename = (
                f"{uuid.uuid4().hex}_{os.path.basename(file.filename)}"
            )

            file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            resume_text = extract_text_from_pdf(file_path)

            if not resume_text.strip():
                continue

            result = screen_candidate(
                resume_text,
                job.current_job
            )

            candidates.append({
                "candidate": file.filename,

                "candidate_details": result["candidate_details"],

                "score": result["final_score"],

                "semantic_score": result["semantic_score"],

                "required_skill_score": result["required_skill_score"],

                "preferred_skill_score": result["preferred_skill_score"],

                "experience_score": result["experience_score"],

                "resume_skills": result["resume_skills"],

                "matched_required": result["matched_required"],

                "missing_required": result["missing_required"],

                "matched_preferred": result["matched_preferred"],

                "missing_preferred": result["missing_preferred"]
            })

        finally:
            await file.close()

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="No valid, readable PDF resumes were uploaded."
        )

    # Sort candidates by final score (highest first)
    candidates.sort(
        key=lambda candidate: candidate["score"],
        reverse=True
    )

    # Assign ranks
    for index, candidate in enumerate(candidates, start=1):
        candidate["rank"] = index

    return {
        "job": job.current_job.job_title,
        "total_candidates": len(candidates),
        "ranking": candidates
    }