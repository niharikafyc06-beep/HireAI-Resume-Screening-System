

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from sqlalchemy.orm import Session

from database import get_db
from models import Company, User, Subscription
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# -------------------------------
# REQUEST AND RESPONSE MODELS
# -------------------------------

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    company_name: str = Field(min_length=2, max_length=150)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    company_id: int


# -------------------------------
# USER REGISTRATION
# -------------------------------

@router.post("/register", response_model=UserResponse)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    email = str(data.email).strip().lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    try:
        company = Company(
            name=data.company_name.strip()
        )

        db.add(company)
        db.flush()

        now = datetime.now(timezone.utc)

        user = User(
            name=data.name.strip(),
            email=email,
            password_hash=hash_password(data.password),
            company_id=company.id
        )

        subscription = Subscription(
            company_id=company.id,
            plan_name="free",
            status="trial",
            monthly_price=0,
            screenings_limit=10,
            start_date=now,
            end_date=now + timedelta(days=14)
        )

        db.add(user)
        db.add(subscription)

        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise


# -------------------------------
# USER LOGIN
# -------------------------------

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    email = form_data.username.strip().lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user or not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(
        user.id,
        user.company_id
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------------------
# GET CURRENT LOGGED-IN USER
# -------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = decode_access_token(token)

        user_id = int(payload["sub"])
        company_id = int(payload["company_id"])

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == company_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


# -------------------------------
# GET LOGGED-IN USER PROFILE
# -------------------------------

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):

    return current_user
