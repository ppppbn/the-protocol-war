"""
Tournament Scheduler for The Protocol War.
Runs tournaments automatically at 00:00 UTC daily.
"""
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .database import SessionLocal
from .engine import run_tournament

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


def run_scheduled_tournament():
    """
    Execute a scheduled tournament.
    Called by APScheduler at 00:00 UTC daily.
    """
    logger.info("=== SCHEDULED TOURNAMENT STARTING ===")
    logger.info(f"Time: {datetime.now(timezone.utc).isoformat()}")
    
    db = SessionLocal()
    try:
        # Check if there are enough active scripts
        from . import models
        script_count = db.query(models.Script).filter(
            models.Script.is_active == True
        ).count()
        
        if script_count < 2:
            logger.warning(f"Not enough scripts for tournament. Need 2, have {script_count}")
            return
        
        # Check for running tournaments
        running = db.query(models.Tournament).filter(
            models.Tournament.status == "running"
        ).first()
        
        if running:
            logger.warning("A tournament is already running. Skipping scheduled run.")
            return
        
        # Run the tournament
        tournament = run_tournament(db, rounds_per_match=100)
        logger.info(f"=== TOURNAMENT COMPLETED: ID {tournament.id} ===")
        
    except Exception as e:
        logger.error(f"Scheduled tournament failed: {e}")
    finally:
        db.close()


def get_next_run_time():
    """Get the next scheduled tournament time."""
    job = scheduler.get_job("daily_tournament")
    if job:
        return job.next_run_time
    return None


def start_scheduler():
    """
    Start the tournament scheduler.
    Schedules daily tournament at 00:00 UTC.
    """
    # Add daily job at 00:00 UTC
    scheduler.add_job(
        run_scheduled_tournament,
        trigger=CronTrigger(hour=0, minute=0, timezone="UTC"),
        id="daily_tournament",
        name="Daily Tournament at 00:00 UTC",
        replace_existing=True
    )
    
    scheduler.start()
    
    next_run = get_next_run_time()
    logger.info(f"Tournament scheduler started. Next run: {next_run}")
    print(f"🕐 Tournament scheduler started. Next tournament: {next_run}")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Tournament scheduler stopped.")
        print("🛑 Tournament scheduler stopped.")


def pause_scheduler():
    """Pause the scheduler (keep jobs but don't run them)."""
    scheduler.pause()
    logger.info("Tournament scheduler paused.")
    

def resume_scheduler():
    """Resume a paused scheduler."""
    scheduler.resume()
    logger.info("Tournament scheduler resumed.")


def is_scheduler_running():
    """Check if scheduler is running and not paused."""
    return scheduler.running and scheduler.state == 1  # 1 = STATE_RUNNING
