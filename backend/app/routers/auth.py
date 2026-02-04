from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import MasterLogin, TenantLogin, Token, SelectTenant, TokenData, UserPasswordChange
from app.services.auth_service import authenticate_master, authenticate_tenant_user, create_access_token, get_tenant_by_slug, change_user_password
from app.deps import get_current_user_token_data, get_current_master
from app.database import get_db, SessionLocal # Use SessionLocal for simple one-offs if dependency injection not passed
from sqlalchemy.orm import Session
from app.models.sql_models import Tenant, User # Direct access for 'me' endpoint

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login-master", response_model=Token)
async def login_master(user_in: MasterLogin, db: Session = Depends(get_db)):
    user = authenticate_master(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(
        data={"sub": user["email"], "role_global": "master"}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/select-tenant", response_model=Token)
async def select_tenant(payload: SelectTenant, current_user: TokenData = Depends(get_current_master), db: Session = Depends(get_db)):
    # Check if tenant exists via auth_service helper (now DB backed)
    tenant_obj = get_tenant_by_slug(db, payload.tenant_slug, allow_inactive=True)
    if not tenant_obj:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    # Generate new token with tenant context
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "role_global": "master",
            "tenant_slug": payload.tenant_slug,
            "tenant_id": str(tenant_obj.id)
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-tenant", response_model=Token)
async def login_tenant(user_in: TenantLogin, db: Session = Depends(get_db)):
    user = authenticate_tenant_user(db, user_in.tenant_slug, user_in.email, user_in.password)
    if not user:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials or tenant",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "role_local": user.get("role", "user"),
            "tenant_slug": user_in.tenant_slug,
            "tenant_id": user.get("tenant_id")
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: TokenData = Depends(get_current_user_token_data), db: Session = Depends(get_db)):
    nome_empresa = None
    logo_url = None
    nicho_nome = None
    cor_principal = None
    payment_status = None
    modulos_habilitados = [] # Feature flags can be stored in JSON/columns
    
    if current_user.tenant_slug:
        env = db.query(Tenant).filter(Tenant.slug == current_user.tenant_slug).first()
        if env:
            nome_empresa = env.name # or business_name
            logo_url = env.logo_url
            cor_principal = env.primary_color
            payment_status = env.payment_status
            modulos_habilitados = env.modulos_habilitados or []
            if env.niche:
                nicho_nome = env.niche.name
            
    return {
        "email": current_user.email,
        "role_global": current_user.role_global,
        "tenant_slug": current_user.tenant_slug,
        "role_local": current_user.role_local,
        "nome_empresa": nome_empresa,
        "logo_url": logo_url,
        "nicho_nome": nicho_nome,
        "cor_principal": cor_principal,
        "payment_status": payment_status,
        "modulos_habilitados": modulos_habilitados
    }

@router.post("/exit-tenant", response_model=Token)
async def exit_tenant(current_user: TokenData = Depends(get_current_master)):
    access_token = create_access_token(
        data={"sub": current_user.email, "role_global": "master"}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/change-password")
async def change_password(payload: UserPasswordChange, current_user: TokenData = Depends(get_current_user_token_data), db: Session = Depends(get_db)):
    success = change_user_password(
        db=db,
        email=current_user.email, 
        old_password=payload.old_password, 
        new_password=payload.new_password,
        role_global=current_user.role_global,
        tenant_slug=current_user.tenant_slug
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to change password. check old password.")
    
    return {"message": "Password updated successfully"}
