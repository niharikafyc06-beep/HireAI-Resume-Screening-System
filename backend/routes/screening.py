
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Annotated
import shutil
import uuid

from database import get_db
from models import Job, Candidate, ScreeningResult
from routes.auth import get_current_user
from services.pdf_parser import extract_text_from_pdf
from services.screening import screen_candidate


router = APIRouter(
    prefix="/screening",
    tags=["Candidate Screening"]
)

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def get_company_job(job_id, company_id, db):

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.company_id == company_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found for your company."
        )

    return job


def save_screening_result(
    resume_text,
    original_filename,
    job,
    current_user,
    db
):

    

    result = screen_candidate(resume_text, job)

    details = result["candidate_details"]

    try:
        experience = float(
            details.get("experience_years") or 0
        )
    except (TypeError, ValueError):
        experience = 0.0

    candidate = Candidate(
        name=details.get("name") or Path(original_filename).stem,
        email=details.get("email"),
        phone=details.get("phone"),
        experience_years=experience,
        resume_path=str(UPLOAD_FOLDER / original_filename),
        company_id=current_user.company_id,
        job_id=job.id
    )

    db.add(candidate)
    db.flush()

    screening_record = ScreeningResult(
        company_id=current_user.company_id,
        job_id=job.id,
        candidate_id=candidate.id,
        final_score=result["final_score"],
        semantic_score=result["semantic_score"],
        required_skill_score=result["required_skill_score"],
        preferred_skill_score=result["preferred_skill_score"],
        experience_score=result["experience_score"],
        result_data=result
    )

    db.add(screening_record)
    db.commit()
    db.refresh(candidate)

    return {
        "candidate_id": candidate.id,
        "candidate": candidate.name,
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
    }


# Analyze a single candidate

@router.post("/analyze")
async def analyze_candidate(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    job = get_company_job(
        job_id,
        current_user.company_id,
        db
    )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    file_path = UPLOAD_FOLDER / safe_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(str(file_path))

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF."
            )

        result = save_screening_result(
            resume_text,
            safe_filename,
            job,
            current_user,
            db
        )

        return {
            "message": "Candidate analyzed successfully",
            "job_id": job.id,
            "job_title": job.title,
            "analysis": result
        }

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Candidate analysis failed."
        )

    finally:
        await file.close()


# Rank multiple candidates

@router.post("/rank")
async def rank_candidates(
    job_id: int,
    files: Annotated[
        list[UploadFile],
        File(description="Upload multiple PDF resumes")
    ],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    job = get_company_job(
        job_id,
        current_user.company_id,
        db
    )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one PDF resume."
        )

    candidates = []

    for file in files:

        file_path = None

        try:
            if not file.filename or not file.filename.lower().endswith(".pdf"):
                continue

            safe_filename = (
                f"{uuid.uuid4().hex}_{Path(file.filename).name}"
            )

            file_path = UPLOAD_FOLDER / safe_filename

            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            resume_text = extract_text_from_pdf(str(file_path))

            if not resume_text.strip():
                file_path.unlink(missing_ok=True)
                continue

            result = save_screening_result(
                resume_text,
                safe_filename,
                job,
                current_user,
                db
            )

            candidates.append(result)

        except Exception:
            db.rollback()

            if file_path and file_path.exists():
                file_path.unlink()

        finally:
            await file.close()

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="No valid, readable PDF resumes were processed."
        )

    candidates.sort(
        key=lambda candidate: candidate["score"],
        reverse=True
    )

    for index, candidate in enumerate(candidates, start=1):
        candidate["rank"] = index

    return {
        "job_id": job.id,
        "job": job.title,
        "total_candidates": len(candidates),
        "ranking": candidates
    }

@router.get("/history")
def get_screening_history(
    job_id: int = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    if offset < 0:
        raise HTTPException(
            status_code=400,
            detail="Offset cannot be negative"
        )

    query = (
        db.query(ScreeningResult, Candidate, Job)
        .join(
            Candidate,
            ScreeningResult.candidate_id == Candidate.id
        )
        .join(
            Job,
            ScreeningResult.job_id == Job.id
        )
        .filter(
            ScreeningResult.company_id == current_user.company_id
        )
    )

    if job_id is not None:
        query = query.filter(
            ScreeningResult.job_id == job_id
        )

    records = (
        query
        .order_by(ScreeningResult.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    history = []

    for screening, candidate, job in records:
        history.append({
            "screening_id": screening.id,
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "job_id": job.id,
            "job_title": job.title,
            "final_score": screening.final_score,
            "semantic_score": screening.semantic_score,
            "required_skill_score": screening.required_skill_score,
            "preferred_skill_score": screening.preferred_skill_score,
            "experience_score": screening.experience_score,
            "screening_date": screening.created_at,
            "details": screening.result_data
        })

    return {
        "total_returned": len(history),
        "history": history
    }
