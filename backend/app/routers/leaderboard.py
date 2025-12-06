"""
Leaderboard API routes
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("/", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Get the global leaderboard sorted by total score.
    Calculates stats from all completed matches.
    """
    # This is a complex query that aggregates match results
    # For now, return an empty list - will implement after tournament engine
    
    # Get all scripts with their aggregated stats
    results = []
    
    scripts = db.query(models.Script).filter(models.Script.is_active == True).all()
    
    for script in scripts:
        # Calculate stats for this script
        matches_as_p1 = db.query(models.Match).filter(
            models.Match.script1_id == script.id
        ).all()
        matches_as_p2 = db.query(models.Match).filter(
            models.Match.script2_id == script.id
        ).all()
        
        total_score = sum(m.score1 for m in matches_as_p1) + sum(m.score2 for m in matches_as_p2)
        matches_played = len(matches_as_p1) + len(matches_as_p2)
        
        # Count wins
        wins = sum(1 for m in matches_as_p1 if m.score1 > m.score2)
        wins += sum(1 for m in matches_as_p2 if m.score2 > m.score1)
        
        avg_score = total_score / matches_played if matches_played > 0 else 0
        
        results.append({
            "rank": 0,  # Will be set after sorting
            "username": script.owner.username,
            "script_name": script.name,
            "total_score": total_score,
            "matches_played": matches_played,
            "wins": wins,
            "avg_score": round(avg_score, 2)
        })
    
    # Sort by total score descending and assign ranks
    results.sort(key=lambda x: x["total_score"], reverse=True)
    for i, entry in enumerate(results):
        entry["rank"] = i + 1
    
    return results
