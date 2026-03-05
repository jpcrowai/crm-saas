from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import Automation
from typing import List, Dict, Any
import uuid

router = APIRouter(prefix="/tenant/automations", tags=["Automations"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_automations(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    autos = db.query(Automation).filter(Automation.tenant_id == current_user.tenant_id).all()
    return [
        {
            "id": str(a.id),
            "name": a.name,
            "trigger_type": a.trigger_type,
            "action_type": a.action_type,
            "action_config": a.action_config,
            "active": a.active
        } for a in autos
    ]

@router.post("/")
async def create_automation(
    data: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    new_auto = Automation(
        tenant_id=current_user.tenant_id,
        name=data.get("name", "Nova Automação"),
        trigger_type=data.get("trigger_type"),
        action_type=data.get("action_type"),
        action_config=data.get("action_config"),
        active=True
    )
    db.add(new_auto)
    db.commit()
    return {"status": "success", "id": str(new_auto.id)}

@router.delete("/{auto_id}")
async def delete_automation(
    auto_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    db.query(Automation).filter(
        Automation.id == auto_id, 
        Automation.tenant_id == current_user.tenant_id
    ).delete()
    db.commit()
    return {"status": "deleted"}
