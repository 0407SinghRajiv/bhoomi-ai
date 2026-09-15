"""
BhoomiAI Backend API
Intelligent Land Record Digitization and Validation System
Smart India Hackathon 2026 - Problem Statement 26018
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import (
    health_router,
    states_router,
    documents_router,
    reconciliation_router,
    verification_router,
    authority_router,
    cadastral_router,
    land_records_router,
    access_requests_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bhoomiai")

app = FastAPI(
    title="BhoomiAI API",
    description="Backend API for BhoomiAI: AI-Powered Land Record Intelligence & Validation Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    from app.database import engine, SessionLocal
    from app.models import Base, State
    from sqlalchemy import text
    try:
        # Auto-create all tables if they do not exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")

        # If database is fresh (no states), seed initial data
        db = SessionLocal()
        try:
            state_count = db.query(State).count()
            if state_count == 0:
                logger.info("Fresh database detected. Auto-seeding initial database...")
                from app.seed import seed_database
                seed_database()
                logger.info("Auto-seeding completed successfully.")
        finally:
            db.close()

        with engine.connect() as conn:
            if engine.url.drivername.startswith("sqlite"):
                info = conn.execute(text("PRAGMA table_info(audit_logs)")).fetchall()
                col_names = [r[1] for r in info]
                if "document_id" not in col_names and len(col_names) > 0:
                    conn.execute(text("ALTER TABLE audit_logs ADD COLUMN document_id INTEGER REFERENCES documents(id)"))
                    conn.commit()
    except Exception as e:
        logger.error(f"Startup initialization notice: {e}", exc_info=True)



# Global Exception Handlers for Clean Error Responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": True,
            "status_code": 400,
            "message": "Invalid request payload or parameters",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "message": "Internal server error. Please try again later.",
        },
    )


# Root Endpoint
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BhoomiAI Core Engine",
        "mode": "Production Environment",
        "version": "1.0.0",
    }


# Include Routers
app.include_router(health_router)
app.include_router(states_router)
app.include_router(documents_router)
app.include_router(reconciliation_router)
app.include_router(verification_router)
app.include_router(authority_router)
app.include_router(cadastral_router)
app.include_router(land_records_router)
app.include_router(access_requests_router)
