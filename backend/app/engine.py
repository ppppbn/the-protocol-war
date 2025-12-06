"""
Tournament engine for The Protocol War.
Handles round-robin tournaments and match orchestration.
"""
from datetime import datetime
from itertools import combinations
from typing import List, Optional
from sqlalchemy.orm import Session

from . import models
from .sandbox import run_match


def run_tournament(db: Session, rounds_per_match: int = 100) -> models.Tournament:
    """
    Execute a full round-robin tournament.
    Every active script plays against every other active script.
    
    Args:
        db: Database session
        rounds_per_match: Number of rounds per match (default 100)
        
    Returns:
        The completed Tournament object
    """
    # Create tournament record
    tournament = models.Tournament(
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    
    try:
        # Get all active scripts
        scripts = db.query(models.Script).filter(
            models.Script.is_active == True
        ).all()
        
        if len(scripts) < 2:
            tournament.status = "completed"
            tournament.completed_at = datetime.utcnow()
            db.commit()
            return tournament
        
        # Generate all matchups (round-robin)
        matchups = list(combinations(scripts, 2))
        
        # Execute each match
        for script1, script2 in matchups:
            score1, score2, _ = run_match(
                script1.code,
                script2.code,
                total_rounds=rounds_per_match
            )
            
            # Record match result
            match = models.Match(
                tournament_id=tournament.id,
                script1_id=script1.id,
                script2_id=script2.id,
                score1=score1,
                score2=score2,
                rounds_played=rounds_per_match,
                played_at=datetime.utcnow()
            )
            db.add(match)
        
        # Mark tournament as completed
        tournament.status = "completed"
        tournament.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        tournament.status = "failed"
        tournament.completed_at = datetime.utcnow()
        db.commit()
        raise e
    
    return tournament


def get_leaderboard_stats(db: Session) -> List[dict]:
    """
    Calculate leaderboard statistics from all matches.
    
    Returns:
        List of leaderboard entries sorted by total score
    """
    scripts = db.query(models.Script).filter(
        models.Script.is_active == True
    ).all()
    
    results = []
    
    for script in scripts:
        # Get all matches where this script participated
        matches_as_p1 = db.query(models.Match).filter(
            models.Match.script1_id == script.id
        ).all()
        matches_as_p2 = db.query(models.Match).filter(
            models.Match.script2_id == script.id
        ).all()
        
        # Calculate totals
        total_score = sum(m.score1 for m in matches_as_p1) + sum(m.score2 for m in matches_as_p2)
        matches_played = len(matches_as_p1) + len(matches_as_p2)
        
        # Count wins
        wins = sum(1 for m in matches_as_p1 if m.score1 > m.score2)
        wins += sum(1 for m in matches_as_p2 if m.score2 > m.score1)
        
        avg_score = total_score / matches_played if matches_played > 0 else 0
        
        results.append({
            "script_id": script.id,
            "username": script.owner.username if script.owner else "Unknown",
            "script_name": script.name,
            "total_score": total_score,
            "matches_played": matches_played,
            "wins": wins,
            "avg_score": round(avg_score, 2)
        })
    
    # Sort by total score descending
    results.sort(key=lambda x: x["total_score"], reverse=True)
    
    # Assign ranks
    for i, entry in enumerate(results):
        entry["rank"] = i + 1
    
    return results
