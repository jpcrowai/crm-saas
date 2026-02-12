from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import User as SQLUser
from app.services.auth_service import get_password_hash

router = APIRouter(prefix="/tenant", tags=["tenant"])

def serialize_user(user: SQLUser) -> Dict[str, Any]:
    """Convert SQLUser to dict with proper UUID serialization"""
    return {
        "id": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "modules_allowed": user.modules_allowed or [],
        "is_master": user.is_master,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.get("/users")
async def get_tenant_users(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    users = db.query(SQLUser).filter(SQLUser.tenant_id == current_user.tenant_id).all()
    return [serialize_user(u) for u in users]

@router.post("/users")
async def create_tenant_user(
    user_in: Dict[str, Any], 
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # Verify if creator is admin
    if current_user.role_local != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    if db.query(SQLUser).filter(SQLUser.email == user_in.get("email")).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Extract modules_allowed or default to empty list
    modules_allowed = user_in.get("modules_allowed", [])
    
    new_user = SQLUser(
        id=uuid.uuid4(),
        email=user_in.get("email"),
        name=user_in.get("name"),
        role=user_in.get("role") or "user",
        password_hash=get_password_hash(user_in.get("password")),
        tenant_id=current_user.tenant_id,
        modules_allowed=modules_allowed
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return serialize_user(new_user)

@router.put("/users/{user_id}")
async def update_tenant_user(
    user_id: str,
    user_update: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # Verify if updater is admin
    if current_user.role_local != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update members")
    
    user = db.query(SQLUser).filter(
        SQLUser.id == user_id,
        SQLUser.tenant_id == current_user.tenant_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    if "name" in user_update:
        user.name = user_update["name"]
    if "role" in user_update:
        user.role = user_update["role"]
    if "modules_allowed" in user_update:
        user.modules_allowed = user_update["modules_allowed"]
    if "password" in user_update and user_update["password"]:
        user.password_hash = get_password_hash(user_update["password"])
    
    db.commit()
    db.refresh(user)
    
    return serialize_user(user)

@router.delete("/users/{user_id}")
async def delete_tenant_user(
    user_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    if current_user.role_local != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete members")
    
    user = db.query(SQLUser).filter(
        SQLUser.id == user_id,
        SQLUser.tenant_id == current_user.tenant_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
