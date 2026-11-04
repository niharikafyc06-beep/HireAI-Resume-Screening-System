from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil

from services.pdf_parser import extract_text_from_pdf


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_text = extract_text_from_pdf(file_path)

    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename,
        "text": resume_text
    }
