from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import MasterLogin, TenantLogin, Token, SelectTenant, TokenData, UserPasswordChange
from app.services.auth_service import authenticate_master, authenticate_tenant_user, create_access_token, get_tenant_file, change_user_password
from app.services.excel_service import read_sheet
from app.deps import get_current_user_token_data, get_current_master
from typing import Any

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login-master", response_model=Token)
async def login_master(user_in: MasterLogin):
    user = authenticate_master(user_in.email, user_in.password)
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
async def select_tenant(payload: SelectTenant, current_user: TokenData = Depends(get_current_master)):
    # Check if tenant exists
    excel_file = get_tenant_file(payload.tenant_slug)
    if not excel_file:
        raise HTTPException(status_code=404, detail="Tenant not active or not found")
        
    # Generate new token with tenant context
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "role_global": "master",
            "tenant_slug": payload.tenant_slug
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-tenant", response_model=Token)
async def login_tenant(user_in: TenantLogin):
    user = authenticate_tenant_user(user_in.tenant_slug, user_in.email, user_in.password)
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
            "tenant_slug": user_in.tenant_slug
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: TokenData = Depends(get_current_user_token_data)):
    nome_empresa = None
    logo_url = None
    nicho_nome = None
    cor_principal = None
    payment_status = None
    modulos_habilitados = []
    
    if current_user.tenant_slug:
        ambientes = read_sheet("ambientes", "ambientes")
        env = next((a for a in ambientes if a["slug"] == current_user.tenant_slug), None)
        if env:
            nome_empresa = env.get("nome_empresa")
            logo_url = env.get("logo_url")
            cor_principal = env.get("cor_principal")
            payment_status = env.get("payment_status")
            modulos_habilitados = env.get("modulos_habilitados") or []
            
            # Lookup Niche Name
            nicho_id = env.get("nicho_id")
            if nicho_id:
                niches_data = read_sheet("niches", "niches")
                niche = next((n for n in niches_data if str(n.get("id")) == str(nicho_id)), None)
                if niche:
                    nicho_nome = niche.get("name")
            
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
    # Simply issue a new token without tenant_slug
    # Validation of 'master' role is done by dependency get_current_master
    
    access_token = create_access_token(
        data={"sub": current_user.email, "role_global": "master"}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/change-password")
async def change_password(payload: UserPasswordChange, current_user: TokenData = Depends(get_current_user_token_data)):
    success = change_user_password(
        email=current_user.email, 
        old_password=payload.old_password, 
        new_password=payload.new_password,
        role_global=current_user.role_global,
        tenant_slug=current_user.tenant_slug
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to change password. check old password.")
    
    return {"message": "Password updated successfully"}
