"""
Seed script to create demo data for testing.
Run with: python -m app.seed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app import models

# Create tables
Base.metadata.create_all(bind=engine)

# Sample strategies
STRATEGIES = {
    "TitForTat": '''def make_decision(history, current_round_index, total_rounds):
    """Classic Tit-for-Tat: cooperate first, then mirror opponent."""
    if current_round_index == 0:
        return 'SYNC'
    return history[-1][1]
''',
    "AlwaysHack": '''def make_decision(history, current_round_index, total_rounds):
    """Always defect - aggressive strategy."""
    return 'HACK'
''',
    "AlwaysSync": '''def make_decision(history, current_round_index, total_rounds):
    """Always cooperate - peaceful strategy."""
    return 'SYNC'
''',
    "Grudger": '''def make_decision(history, current_round_index, total_rounds):
    """Cooperate until betrayed, then always defect."""
    if current_round_index == 0:
        return 'SYNC'
    # If opponent ever hacked, always hack back
    for my_move, opp_move in history:
        if opp_move == 'HACK':
            return 'HACK'
    return 'SYNC'
''',
    "Random": '''def make_decision(history, current_round_index, total_rounds):
    """Random choice - unpredictable."""
    import random
    return random.choice(['SYNC', 'HACK'])
'''
}


def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_users = db.query(models.User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping seed.")
            return
        
        # Create demo users
        users = [
            models.User(username="agent_smith", email="smith@matrix.io"),
            models.User(username="neo", email="neo@zion.net"),
            models.User(username="morpheus", email="morpheus@nebula.com"),
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        print(f"Created {len(users)} users")
        
        # Create scripts - distribute among users
        scripts_to_create = [
            (users[0], "TitForTat", STRATEGIES["TitForTat"]),
            (users[0], "Grudger", STRATEGIES["Grudger"]),
            (users[1], "AlwaysHack", STRATEGIES["AlwaysHack"]),
            (users[1], "Random", STRATEGIES["Random"]),
            (users[2], "AlwaysSync", STRATEGIES["AlwaysSync"]),
        ]
        
        for user, name, code in scripts_to_create:
            script = models.Script(
                user_id=user.id,
                name=name,
                code=code,
                is_active=True
            )
            db.add(script)
        
        db.commit()
        print(f"Created {len(scripts_to_create)} scripts")
        print("\nDemo data seeded successfully!")
        print("\nUsers:")
        for u in users:
            print(f"  - {u.username} ({u.email})")
        print("\nScripts:")
        for user, name, _ in scripts_to_create:
            print(f"  - {name} by {user.username}")
            
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
