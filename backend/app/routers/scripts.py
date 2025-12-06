"""
Script management API routes
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas
from ..sandbox import validate_script

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


class ValidationRequest(BaseModel):
    code: str


class ValidationResponse(BaseModel):
    valid: bool
    errors: List[str]


@router.post("/validate", response_model=ValidationResponse)
def validate_script_endpoint(request: ValidationRequest):
    """
    Validate a script without saving it.
    Checks syntax, security, and required function signature.
    """
    is_valid, errors = validate_script(request.code)
    return {"valid": is_valid, "errors": errors}


@router.post("/", response_model=schemas.ScriptResponse)
def create_script(script: schemas.ScriptCreate, db: Session = Depends(get_db)):
    """Upload a new strategy script"""
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == script.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate script before saving
    is_valid, errors = validate_script(script.code)
    if not is_valid:
        raise HTTPException(
            status_code=400, 
            detail={"message": "Script validation failed", "errors": errors}
        )
    
    db_script = models.Script(
        user_id=script.user_id,
        name=script.name,
        code=script.code
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script


@router.get("/", response_model=List[schemas.ScriptResponse])
def list_scripts(user_id: int = None, db: Session = Depends(get_db)):
    """List all scripts, optionally filtered by user"""
    query = db.query(models.Script)
    if user_id:
        query = query.filter(models.Script.user_id == user_id)
    return query.all()


@router.get("/{script_id}", response_model=schemas.ScriptWithOwner)
def get_script(script_id: int, db: Session = Depends(get_db)):
    """Get a specific script by ID"""
    script = db.query(models.Script).filter(models.Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@router.put("/{script_id}", response_model=schemas.ScriptResponse)
def update_script(
    script_id: int, 
    script_update: schemas.ScriptUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing script"""
    db_script = db.query(models.Script).filter(models.Script.id == script_id).first()
    if not db_script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    # Validate new code if being updated
    if script_update.code:
        is_valid, errors = validate_script(script_update.code)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail={"message": "Script validation failed", "errors": errors}
            )
    
    update_data = script_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_script, key, value)
    
    db.commit()
    db.refresh(db_script)
    return db_script


@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    """Delete a script"""
    db_script = db.query(models.Script).filter(models.Script.id == script_id).first()
    if not db_script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    db.delete(db_script)
    db.commit()
    return {"message": "Script deleted successfully"}
