from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import User, TokenData, UserCreate
from app.models.sql_models import User as SQLUser
from app.services.auth_service import get_password_hash

router = APIRouter(prefix="/tenant", tags=["tenant"])

@router.get("/users", response_model=List[User])
async def get_tenant_users(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    users = db.query(SQLUser).filter(SQLUser.tenant_id == current_user.tenant_id).all()
    return users

@router.post("/users", response_model=User)
async def create_tenant_user(
    user_in: UserCreate, 
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # Verify if creator is admin
    if current_user.role_local != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    if db.query(SQLUser).filter(SQLUser.email == user_in.email).first():
        # Check if already in the team or system-wide (system-wide emails must be unique for now)
        raise HTTPException(status_code=400, detail="Email already exists")
        
    new_user = SQLUser(
        id=uuid.uuid4(),
        email=user_in.email,
        name=user_in.name,
        role=user_in.role or "user",
        password_hash=get_password_hash(user_in.password),
        tenant_id=current_user.tenant_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
