from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.models.sql_models import User, Tenant
from app.database import SessionLocal
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

# SECRET_KEY and Config - Prefer Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Important: Support both PBKDF2 (new) and BCrypt (old/standard) to avoid crashes
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_master(db: Session, email: str, password: str):
    # Fetch user by email
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not user.is_master:
        return False
        
    if not verify_password(password, user.password_hash):
        return False
        
    return {"email": user.email, "role": user.role}

def authenticate_tenant_user(db: Session, tenant_slug: str, email: str, password: str):
    # 1. Verify Tenant
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        return None
        
    # 2. Verify User
    user = db.query(User).filter(User.email == email, User.tenant_id == tenant.id).first()
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None
        
    return {"email": user.email, "role": user.role, "tenant_id": str(tenant.id)}

def get_tenant_by_slug(db: Session, tenant_slug: str, allow_inactive: bool = False):
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        return None
    
    if not allow_inactive and not tenant.active:
        return None
        
    return tenant

def change_user_password(db: Session, email: str, old_password: str, new_password: str, role_global: str = None, tenant_slug: str = None):
    try:
        user = None
        
        if role_global == "master":
            # Master changing own password
            user = db.query(User).filter(User.email == email, User.is_master == True).first()
        elif tenant_slug:
            # Tenant User changing own password
            tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
            if tenant:
                user = db.query(User).filter(User.email == email, User.tenant_id == tenant.id).first()
        
        if not user:
            return False
            
        if not verify_password(old_password, user.password_hash):
            return False
            
        user.password_hash = get_password_hash(new_password)
        db.commit()
        return True
    except Exception as e:
        print(f"Error changing password: {e}")
        db.rollback()
        return False
