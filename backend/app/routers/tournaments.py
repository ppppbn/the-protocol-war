"""
Tournament API routes
"""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from .. import models
from ..engine import run_tournament, get_leaderboard_stats
from ..scheduler import get_next_run_time

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


class TournamentResponse(BaseModel):
    id: int
    status: str
    started_at: str | None
    completed_at: str | None
    
    class Config:
        from_attributes = True


class TournamentStartResponse(BaseModel):
    message: str
    tournament_id: int


@router.post("/start", response_model=TournamentStartResponse)
def start_tournament(
    rounds_per_match: int = 100,
    db: Session = Depends(get_db)
):
    """
    Start a new round-robin tournament.
    All active scripts will compete against each other.
    """
    # Check if there are enough scripts
    script_count = db.query(models.Script).filter(
        models.Script.is_active == True
    ).count()
    
    if script_count < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least 2 active scripts. Currently have {script_count}."
        )
    
    # Check for running tournaments
    running = db.query(models.Tournament).filter(
        models.Tournament.status == "running"
    ).first()
    
    if running:
        raise HTTPException(
            status_code=400,
            detail="A tournament is already running."
        )
    
    # Run tournament (synchronous for now - could be async with BackgroundTasks)
    tournament = run_tournament(db, rounds_per_match)
    
    return {
        "message": "Tournament completed!",
        "tournament_id": tournament.id
    }


@router.get("/", response_model=List[TournamentResponse])
def list_tournaments(db: Session = Depends(get_db)):
    """List all tournaments, most recent first."""
    tournaments = db.query(models.Tournament).order_by(
        models.Tournament.id.desc()
    ).limit(10).all()
    
    return [
        {
            "id": t.id,
            "status": t.status,
            "started_at": t.started_at.isoformat() if t.started_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None
        }
        for t in tournaments
    ]


# NOTE: /next must be defined BEFORE /{tournament_id} to avoid route conflict
@router.get("/next")
def get_next_tournament():
    """Get the next scheduled tournament time (public endpoint)."""
    next_run = get_next_run_time()
    now = datetime.now(timezone.utc)
    
    if next_run:
        # Calculate time remaining
        delta = next_run - now
        total_seconds = int(delta.total_seconds())
        
        if total_seconds < 0:
            total_seconds = 0
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return {
            "next_tournament": next_run.isoformat(),
            "current_time": now.isoformat(),
            "seconds_remaining": total_seconds,
            "countdown": f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        }
    
    return {
        "next_tournament": None,
        "current_time": now.isoformat(),
        "seconds_remaining": None,
        "countdown": None
    }


@router.get("/{tournament_id}")
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Get details of a specific tournament."""
    tournament = db.query(models.Tournament).filter(
        models.Tournament.id == tournament_id
    ).first()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get matches for this tournament
    matches = db.query(models.Match).filter(
        models.Match.tournament_id == tournament_id
    ).all()
    
    return {
        "id": tournament.id,
        "status": tournament.status,
        "started_at": tournament.started_at.isoformat() if tournament.started_at else None,
        "completed_at": tournament.completed_at.isoformat() if tournament.completed_at else None,
        "match_count": len(matches),
        "matches": [
            {
                "script1": m.script1.name if m.script1 else "Unknown",
                "script2": m.script2.name if m.script2 else "Unknown",
                "score1": m.score1,
                "score2": m.score2
            }
            for m in matches
        ]
    }
