from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.sql_models import BotSession as SQLBotSession, Lead as SQLLead
from app.models.schemas import BotSession, BotSessionBase, TokenData

router = APIRouter(prefix="/tenant/bot", tags=["bot"])

@router.get("/sessions", response_model=List[BotSession])
async def get_bot_sessions(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """List active bot sessions for the tenant."""
    sessions = db.query(SQLBotSession).filter(
        SQLBotSession.tenant_id == current_user.tenant_id
    ).order_by(SQLBotSession.updated_at.desc()).limit(20).all()
    return sessions

@router.post("/telemetry")
async def update_bot_telemetry(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Endpoint for n8n to report bot telemetry.
    Expects: { "tenant_id": "...", "customer_id": "...", "customer_name": "...", "status": "...", "current_step": "...", "progress": 50, "message": "..." }
    """
    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    
    # Generate common ID based on lead_id or customer_name to track session
    lead_id = data.get("lead_id")
    customer_name = data.get("customer_name")
    
    # Try to find existing active session for this lead/customer
    session = None
    if lead_id:
        session = db.query(SQLBotSession).filter(
            SQLBotSession.tenant_id == tenant_id,
            SQLBotSession.lead_id == lead_id,
            SQLBotSession.status == "active"
        ).first()
    
    if not session and customer_name:
        session = db.query(SQLBotSession).filter(
            SQLBotSession.tenant_id == tenant_id,
            SQLBotSession.customer_name == customer_name,
            SQLBotSession.status == "active"
        ).first()

    if not session:
        session = SQLBotSession(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            lead_id=lead_id,
            customer_name=customer_name
        )
        db.add(session)
    
    # Update fields
    if "status" in data: session.status = data["status"]
    if "current_step" in data: session.current_step = data["current_step"]
    if "progress" in data: session.step_progress = data["progress"]
    if "message" in data: session.last_message = data["message"]
    
    db.commit()
    return {"status": "success"}

@router.get("/health")
async def check_bot_health(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Mock health check - in real scenario, could ping n8n webhook."""
    # Check if there was any telemetry in the last hour
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    
    recent_activity = db.query(SQLBotSession).filter(
        SQLBotSession.tenant_id == current_user.tenant_id,
        SQLBotSession.updated_at >= one_hour_ago
    ).count()
    
    return {
        "status": "online" if recent_activity > 0 else "idle",
        "last_activity": "Recent" if recent_activity > 0 else "None in last hour",
        "active_sessions": db.query(SQLBotSession).filter(
            SQLBotSession.tenant_id == current_user.tenant_id,
            SQLBotSession.status == "active"
        ).count()
    }
