from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.services.ai_service import AIService
from typing import Dict, Any, List

router = APIRouter(prefix="/tenant/ai", tags=["AI Insights"])

@router.get("/insights")
async def get_ai_insights(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-driven insights for the tenant dashboard.
    """
    tenant_id = current_user.tenant_id
    
    churn_alerts = AIService.get_churn_alerts(db, tenant_id)
    revenue_forecast = AIService.get_revenue_forecast(db, tenant_id)
    sales_insights = AIService.get_sales_insights(db, tenant_id)
    
    return {
        "churn_alerts": churn_alerts,
        "revenue_forecast": revenue_forecast,
        "sales_insights": sales_insights,
        "timestamp": str(datetime.now())
    }
