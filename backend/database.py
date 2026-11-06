

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


# Read database URL from environment variables.
# Use SQLite locally if DATABASE_URL is not configured.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./hireai.db"
)


# Convert PostgreSQL URLs to the psycopg driver format.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1
    )

elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )


# SQLite requires special connection arguments.
connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)


# Create database engine.
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)


# Create database session.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for SQLAlchemy models.
class Base(DeclarativeBase):
    pass


# Database dependency for FastAPI routes.
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
