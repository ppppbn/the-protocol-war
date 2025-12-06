"""
The Protocol War - Backend API
A cyberpunk-themed Iterated Prisoner's Dilemma tournament platform
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import scripts, leaderboard, users, tournaments, admin
from .scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for the FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting The Protocol War...")
    start_scheduler()
    yield
    # Shutdown
    logger.info("🛑 Shutting down The Protocol War...")
    stop_scheduler()


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="The Protocol War",
    description="Battle for global compute dominance. SYNC or HACK - the choice is yours.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(scripts.router)
app.include_router(leaderboard.router)
app.include_router(tournaments.router)
app.include_router(admin.router)


@app.get("/")
def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to The Protocol War",
        "status": "NETWORK ONLINE",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "operational", "network": "stable"}
