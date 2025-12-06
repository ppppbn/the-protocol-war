"""
Pydantic schemas for API request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ============ User Schemas ============
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Script Schemas ============
class ScriptBase(BaseModel):
    name: str
    code: str


class ScriptCreate(ScriptBase):
    user_id: int


class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None


class ScriptResponse(ScriptBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptWithOwner(ScriptResponse):
    owner: UserResponse


# ============ Tournament Schemas ============
class TournamentBase(BaseModel):
    status: str = "pending"


class TournamentCreate(TournamentBase):
    pass


class TournamentResponse(TournamentBase):
    id: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ Match Schemas ============
class MatchBase(BaseModel):
    script1_id: int
    script2_id: int


class MatchResponse(MatchBase):
    id: int
    tournament_id: int
    score1: int
    score2: int
    rounds_played: int
    played_at: datetime

    class Config:
        from_attributes = True


# ============ Leaderboard Schemas ============
class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    script_name: str
    total_score: int
    matches_played: int
    wins: int
    avg_score: float
