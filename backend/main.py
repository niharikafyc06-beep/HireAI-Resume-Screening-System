
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from database import Base, engine

# Import models so SQLAlchemy registers all database tables.
import models

from routes.resume import router as resume_router
from routes.job import router as job_router
from routes.screening import router as screening_router
from routes.auth import router as auth_router


app = FastAPI(
    title="AI Resume Screening & Candidate Ranking System",
    description="AI-powered system for screening and ranking candidates based on company requirements",
    version="1.0.0"
)


# Create missing database tables during application startup.
@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)


# CORS configuration.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Register routers.
app.include_router(resume_router)
app.include_router(job_router)
app.include_router(screening_router)
app.include_router(auth_router)


@app.get("/")
def home():
    return {
        "message": "AI Resume Screening System is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# Fix Swagger file upload display.
def custom_openapi():

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes
    )

    openapi_schema["openapi"] = "3.0.3"

    def fix_file_schema(schema):

        if isinstance(schema, dict):

            if schema.get("contentMediaType") == "application/octet-stream":
                schema.pop("contentMediaType", None)
                schema["format"] = "binary"

            for value in schema.values():
                fix_file_schema(value)

        elif isinstance(schema, list):

            for item in schema:
                fix_file_schema(item)

    fix_file_schema(openapi_schema)

    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi
