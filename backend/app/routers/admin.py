"""
Admin API routes for The Protocol War.
Hidden admin panel with password authentication.
"""
import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from .. import models
from ..engine import run_tournament
from ..scheduler import (
    get_next_run_time, 
    pause_scheduler, 
    resume_scheduler, 
    is_scheduler_running,
    run_scheduled_tournament
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Configuration
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "protocol-war-admin-2157")
JWT_SECRET = os.getenv("JWT_SECRET", "jwt-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


# Request/Response models
class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: str


class StatusResponse(BaseModel):
    scheduler_running: bool
    next_tournament: str | None
    current_time: str


class TournamentTriggerResponse(BaseModel):
    success: bool
    message: str
    tournament_id: int | None = None


# Token verification
def verify_token(authorization: str = Header(...)) -> bool:
    """Verify JWT token from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return True
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Routes
@router.post("/login", response_model=LoginResponse)
def admin_login(request: LoginRequest):
    """
    Admin login with password.
    Returns JWT token for subsequent requests.
    """
    if not secrets.compare_digest(request.password, ADMIN_SECRET):
        raise HTTPException(status_code=403, detail="Invalid password")
    
    expires_at = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "role": "admin",
        "iat": datetime.now(timezone.utc),
        "exp": expires_at
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "expires_at": expires_at.isoformat()
    }


@router.get("/status", response_model=StatusResponse)
def get_scheduler_status(authorized: bool = Depends(verify_token)):
    """Get current scheduler status and next tournament time."""
    next_run = get_next_run_time()
    
    return {
        "scheduler_running": is_scheduler_running(),
        "next_tournament": next_run.isoformat() if next_run else None,
        "current_time": datetime.now(timezone.utc).isoformat()
    }


@router.post("/trigger-tournament", response_model=TournamentTriggerResponse)
def trigger_tournament(authorized: bool = Depends(verify_token)):
    """
    Manually trigger a tournament immediately.
    Bypasses the scheduler.
    """
    db = SessionLocal()
    try:
        # Check for enough scripts
        script_count = db.query(models.Script).filter(
            models.Script.is_active == True
        ).count()
        
        if script_count < 2:
            return {
                "success": False,
                "message": f"Need at least 2 active scripts. Currently have {script_count}.",
                "tournament_id": None
            }
        
        # Check for running tournaments
        running = db.query(models.Tournament).filter(
            models.Tournament.status == "running"
        ).first()
        
        if running:
            return {
                "success": False,
                "message": "A tournament is already running.",
                "tournament_id": running.id
            }
        
        # Run tournament
        tournament = run_tournament(db, rounds_per_match=100)
        
        return {
            "success": True,
            "message": "Tournament completed successfully!",
            "tournament_id": tournament.id
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Tournament failed: {str(e)}",
            "tournament_id": None
        }
    finally:
        db.close()


@router.post("/pause-scheduler")
def pause_tournament_scheduler(authorized: bool = Depends(verify_token)):
    """Pause the automatic tournament scheduler."""
    pause_scheduler()
    return {"message": "Scheduler paused", "running": False}


@router.post("/resume-scheduler")
def resume_tournament_scheduler(authorized: bool = Depends(verify_token)):
    """Resume the automatic tournament scheduler."""
    resume_scheduler()
    return {"message": "Scheduler resumed", "running": True}


@router.get("/tournaments")
def list_recent_tournaments(authorized: bool = Depends(verify_token)):
    """List recent tournaments with stats."""
    db = SessionLocal()
    try:
        tournaments = db.query(models.Tournament).order_by(
            models.Tournament.id.desc()
        ).limit(20).all()
        
        return [
            {
                "id": t.id,
                "status": t.status,
                "started_at": t.started_at.isoformat() if t.started_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "match_count": len(t.matches) if t.matches else 0
            }
            for t in tournaments
        ]
    finally:
        db.close()


# ===== Agent Management =====

@router.get("/agents")
def list_all_agents(authorized: bool = Depends(verify_token)):
    """List all agents/scripts with their status."""
    db = SessionLocal()
    try:
        scripts = db.query(models.Script).order_by(
            models.Script.id.desc()
        ).all()
        
        return [
            {
                "id": s.id,
                "name": s.name,
                "owner": s.owner.username if s.owner else "Unknown",
                "is_active": s.is_active,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in scripts
        ]
    finally:
        db.close()


@router.post("/agents/{script_id}/toggle")
def toggle_agent_status(script_id: int, authorized: bool = Depends(verify_token)):
    """Toggle an agent's active status."""
    db = SessionLocal()
    try:
        script = db.query(models.Script).filter(
            models.Script.id == script_id
        ).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Toggle status
        script.is_active = not script.is_active
        db.commit()
        
        status = "activated" if script.is_active else "deactivated"
        return {
            "success": True,
            "message": f"Agent '{script.name}' has been {status}",
            "is_active": script.is_active
        }
    finally:
        db.close()


@router.post("/agents/{script_id}/activate")
def activate_agent(script_id: int, authorized: bool = Depends(verify_token)):
    """Activate an agent."""
    db = SessionLocal()
    try:
        script = db.query(models.Script).filter(
            models.Script.id == script_id
        ).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        script.is_active = True
        db.commit()
        
        return {
            "success": True,
            "message": f"Agent '{script.name}' has been activated",
            "is_active": True
        }
    finally:
        db.close()


@router.post("/agents/{script_id}/deactivate")
def deactivate_agent(script_id: int, authorized: bool = Depends(verify_token)):
    """Deactivate an agent."""
    db = SessionLocal()
    try:
        script = db.query(models.Script).filter(
            models.Script.id == script_id
        ).first()
        
        if not script:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        script.is_active = False
        db.commit()
        
        return {
            "success": True,
            "message": f"Agent '{script.name}' has been deactivated",
            "is_active": False
        }
    finally:
        db.close()

