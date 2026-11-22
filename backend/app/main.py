import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.database.mongodb import init_db
from backend.app.utils.seed_data import seed_database_if_empty

from backend.app.api.auth import router as auth_router
from backend.app.api.jobs import router as jobs_router
from backend.app.api.candidates import router as candidates_router
from backend.app.api.matching import router as matching_router
from backend.app.api.rag import router as rag_router
from backend.app.api.interview import router as interview_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.settings import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("talentmatch.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed demo data
    logger.info("Initializing TalentMatch AI backend...")
    await init_db()
    try:
        await seed_database_if_empty()
        logger.info("Demo company and seed data verified.")
    except Exception as e:
        logger.warning(f"Seed verification warning: {e}")
    yield
    logger.info("Shutting down TalentMatch AI backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TalentMatch AI – RAG-Powered Intelligent Recruitment Platform API with Semantic Matching, Hybrid Search, and Grounded Answers",
    lifespan=lifespan
)

# CORS Middleware configured for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(candidates_router, prefix=settings.API_V1_STR)
app.include_router(matching_router, prefix=settings.API_V1_STR)
app.include_router(rag_router, prefix=settings.API_V1_STR)
app.include_router(interview_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "api_docs": "/docs",
        "llm_provider": settings.LLM_PROVIDER,
        "demo_mode": settings.DEMO_MODE
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "talentmatch-backend"}

