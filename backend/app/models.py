"""
Database models for The Protocol War
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """User accounts for the platform"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scripts = relationship("Script", back_populates="owner")


class Script(Base):
    """User-uploaded strategy scripts"""
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="scripts")


class Tournament(Base):
    """Tournament instances"""
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), default="pending")  # pending, running, completed
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Relationships
    matches = relationship("Match", back_populates="tournament")


class Match(Base):
    """Individual matches between two scripts"""
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    script1_id = Column(Integer, ForeignKey("scripts.id"), nullable=False)
    script2_id = Column(Integer, ForeignKey("scripts.id"), nullable=False)
    score1 = Column(Integer, default=0)
    score2 = Column(Integer, default=0)
    rounds_played = Column(Integer, default=100)
    played_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    script1 = relationship("Script", foreign_keys=[script1_id])
    script2 = relationship("Script", foreign_keys=[script2_id])
