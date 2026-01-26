from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
import uuid
import os
import json
import shutil
from app.deps import get_current_master
from app.models.schemas import Environment, TokenData, EnvironmentUpdate
from app.services.excel_service import read_sheet, write_sheet, init_excel_file

router = APIRouter(prefix="/master", tags=["master"])

@router.get("/ambientes", response_model=List[Environment])
async def get_ambientes(current_user: TokenData = Depends(get_current_master)):
    ambientes = read_sheet("ambientes", "ambientes")
    for a in ambientes:
        # Backward compatibility
        if not a.get("nome_empresa") and a.get("nome"):
            a["nome_empresa"] = a["nome"]
        if not a.get("nicho_id") and a.get("nicho"):
            # If nicho contains a name, we keep it in 'nicho' field as per schema update
            # but for consistency with new records we can try to find id or just use name
            a["nicho_id"] = a["nicho"]
            
        if a.get("modulos_habilitados") is None:
            a["modulos_habilitados"] = []
    return [Environment(**a) for a in ambientes]

@router.post("/ambientes", response_model=Environment)
async def create_ambiente(
    nome_empresa: str = Form(...),
    slug: str = Form(...),
    admin_email: str = Form(...),
    admin_password: str = Form(...),
    nicho_id: Optional[str] = Form(None),
    cor_principal: Optional[str] = Form("#0055FF"),
    plan: Optional[str] = Form("basic"),
    modulos_habilitados: Optional[str] = Form(None), # JSON string from frontend
    logo: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_master)
):
    ambientes = read_sheet("ambientes", "ambientes")
    
    if any(a["slug"] == slug for a in ambientes):
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    # Process modulos_habilitados
    mods = ["dashboard", "leads_pipeline", "agenda", "clientes", "equipe", "financeiro", "produtos", "assinaturas"]
    if modulos_habilitados:
        try:
            mods = json.loads(modulos_habilitados)
        except:
            pass

    # Save Logo
    logo_url = ""
    if logo:
        static_dir = os.path.join("static", "logos")
        os.makedirs(static_dir, exist_ok=True)
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(static_dir, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        logo_url = f"/static/logos/{filename}"

    new_id = str(uuid.uuid4())
    excel_filename = f"{slug}.xlsx"
    
    new_env = {
        "id": new_id,
        "slug": slug,
        "nome_empresa": nome_empresa,
        "excel_file": excel_filename,
        "logo_url": logo_url,
        "nicho_id": nicho_id or "",
        "cor_principal": cor_principal,
        "plan": plan,
        "payment_status": "trial",
        "ativo": True,
        "modulos_habilitados": mods
    }
    
    # Init tenant excel
    from app.services.auth_service import get_password_hash
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "name": "Admin",
        "role": "admin",
        "password_hash": get_password_hash(admin_password)
    }
    
    lead_columns = ["id", "name", "email", "phone", "status", "value", "created_at"]
    if nicho_id:
        try:
            niches_data = read_sheet("niches", "niches")
            selected_niche = next((n for n in niches_data if str(n.get("id")) == str(nicho_id)), None)
            if selected_niche:
                cols = selected_niche.get("columns") or []
                for c in cols:
                    if c not in lead_columns:
                        lead_columns.append(c)
        except Exception as e:
            print(f"Error loading niche columns: {e}")
    
    init_excel_file(slug, {
        "users": ["id", "email", "name", "role", "password_hash"],
        "leads": lead_columns
    })
    
    write_sheet(slug, "users", [admin_user])
    ambientes.append(new_env)
    write_sheet("ambientes", "ambientes", ambientes)
    
    return Environment(**new_env)

@router.put("/ambientes/{slug}", response_model=Environment)
async def update_ambiente(
    slug: str,
    nome_empresa: Optional[str] = Form(None),
    nicho_id: Optional[str] = Form(None),
    plan: Optional[str] = Form(None),
    payment_status: Optional[str] = Form(None),
    ativo: Optional[bool] = Form(None),
    modulos_habilitados: Optional[str] = Form(None), # JSON from frontend
    logo: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_master)
):
    ambientes = read_sheet("ambientes", "ambientes")
    env_idx = next((i for i, a in enumerate(ambientes) if a["slug"] == slug), -1)
    
    if env_idx == -1:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    env = ambientes[env_idx]
    
    if nome_empresa is not None: env["nome_empresa"] = nome_empresa
    if nicho_id is not None: env["nicho_id"] = nicho_id
    if plan is not None: env["plan"] = plan
    if payment_status is not None: env["payment_status"] = payment_status
    if ativo is not None: env["ativo"] = ativo
    if modulos_habilitados is not None:
        try:
            env["modulos_habilitados"] = json.loads(modulos_habilitados)
        except:
            pass
            
    if logo:
        static_dir = os.path.join("static", "logos")
        os.makedirs(static_dir, exist_ok=True)
        # Cleanup old logo? Optional but good practice
        # if env.get("logo_url"): ...
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(static_dir, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        env["logo_url"] = f"/static/logos/{filename}"
        
    ambientes[env_idx] = env
    write_sheet("ambientes", "ambientes", ambientes)
    
    return Environment(**env)

@router.delete("/ambientes/{slug}")
async def delete_ambiente(slug: str, current_user: TokenData = Depends(get_current_master)):
    ambientes = read_sheet("ambientes", "ambientes")
    env_idx = next((i for i, a in enumerate(ambientes) if a["slug"] == slug), -1)
    if env_idx == -1: raise HTTPException(status_code=404)
    env = ambientes[env_idx]
    excel_path = os.path.join("data", f"{slug}.xlsx")
    if os.path.exists(excel_path): os.remove(excel_path)
    ambientes.pop(env_idx)
    write_sheet("ambientes", "ambientes", ambientes)
    return {"message": f"Ambiente '{env.get('nome_empresa', slug)}' excluído"}
