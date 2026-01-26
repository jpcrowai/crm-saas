from fastapi import APIRouter, HTTPException, Depends
from typing import List
import json
import uuid
from datetime import datetime
from app.models.schemas import Niche, NicheCreate
from app.services.excel_service import read_sheet, write_sheet
from app.deps import get_current_master

router = APIRouter(prefix="/niches", tags=["niches"])

@router.get("/", response_model=List[Niche])
async def get_niches():
    data = read_sheet("niches", "niches")
    niches = []
    for row in data:
        # excel_service now handles JSON parsing automatically for [] and {}, 
        # so we just need to ensure types match Pydantic expectations.
        niches.append(Niche(
            id=row.get("id"),
            name=row.get("name"),
            columns=row.get("columns") or [],
            pipeline_stages=row.get("pipeline_stages") or [],
            created_at=row.get("created_at"),
            ativo=row.get("ativo", True)
        ))
    return niches

@router.post("/", response_model=Niche)
async def create_niche(niche_in: NicheCreate, current_user = Depends(get_current_master)):
    niches = read_sheet("niches", "niches")
    
    if any(n["name"].lower() == niche_in.name.lower() for n in niches):
        raise HTTPException(status_code=400, detail="Niche name already exists")
    
    new_id = str(uuid.uuid4())
    new_niche_data = {
        "id": new_id,
        "name": niche_in.name,
        "columns": niche_in.columns or [],
        "pipeline_stages": niche_in.pipeline_stages or ["Novo", "Em Contato", "Agendado"],
        "created_at": datetime.now().isoformat(),
        "ativo": True
    }
    
    niches.append(new_niche_data)
    write_sheet("niches", "niches", niches)
    return Niche(**new_niche_data)

@router.put("/{niche_id}", response_model=Niche)
async def update_niche(niche_id: str, niche_in: NicheCreate, current_user = Depends(get_current_master)):
    niches = read_sheet("niches", "niches")
    idx = next((i for i, n in enumerate(niches) if n.get("id") == niche_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    niches[idx].update({
        "name": niche_in.name,
        "columns": niche_in.columns,
        "pipeline_stages": niche_in.pipeline_stages,
        "ativo": niche_in.ativo
    })
    
    write_sheet("niches", "niches", niches)
    return Niche(**niches[idx])
