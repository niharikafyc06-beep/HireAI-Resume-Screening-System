
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import uuid

from database import get_db
from models import Candidate
from routes.auth import get_current_user
from services.pdf_parser import extract_text_from_pdf


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    unique_filename = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    file_path = UPLOAD_FOLDER / unique_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(str(file_path))

        candidate = Candidate(
            name=Path(file.filename).stem,
            resume_path=str(file_path),
            company_id=current_user.company_id
        )

        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {
            "message": "Resume uploaded successfully",
            "candidate_id": candidate.id,
            "filename": unique_filename,
            "text": resume_text
        }

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Resume upload failed"
        )

    finally:
        await file.close()
