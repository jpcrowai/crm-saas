from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models import schemas
from app.models.schemas import TokenData
from app.models.sql_models import Commission, Professional, ProfessionalPerformance, Appointment
from datetime import datetime, timedelta

router = APIRouter(prefix="/tenant/commissions", tags=["commissions"])

@router.get("/dashboard", response_model=Dict[str, Any])
def get_commission_dashboard(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
    period: str = None # YYYY-MM
):
    """Retorna métricas gerais de comissão do tenant"""
    if not period:
        period = datetime.now().strftime("%Y-%m")
    
    # Global stats for the period
    stats = db.query(
        func.count(Commission.id).label("total_services"),
        func.sum(Commission.service_value).label("total_revenue"),
        func.sum(Commission.commission_value).label("total_commission")
    ).filter(
        Commission.tenant_id == current_user.tenant_id,
        func.to_char(Commission.created_at, 'YYYY-MM') == period
    ).first()

    # Ranking of professionals
    ranking = db.query(
        Professional.name,
        Professional.id,
        func.sum(Commission.commission_value).label("total_commission"),
        func.count(Commission.id).label("services_count")
    ).join(
        Commission, Commission.professional_id == Professional.id
    ).filter(
        Commission.tenant_id == current_user.tenant_id,
        func.to_char(Commission.created_at, 'YYYY-MM') == period
    ).group_by(Professional.id).order_by(desc("total_commission")).all()

    return {
        "summary": {
            "total_services": stats.total_services or 0,
            "total_revenue": float(stats.total_revenue or 0),
            "total_commission": float(stats.total_commission or 0),
            "avg_commission": float((stats.total_commission or 0) / (stats.total_services or 1))
        },
        "ranking": [
            {
                "professional_id": str(r.id),
                "professional_name": r.name,
                "total_commission": float(r.total_commission or 0),
                "services_count": r.services_count
            } for r in ranking
        ]
    }

@router.get("/professional/{professional_id}", response_model=Dict[str, Any])
def get_professional_stats(
    professional_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Métricas detalhadas de um profissional específico"""
    prof = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.tenant_id == current_user.tenant_id
    ).first()
    
    if not prof:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")

    # Aggregated metrics
    metrics = db.query(
        func.count(Commission.id).label("total_services"),
        func.count(func.distinct(Commission.appointment_id)).label("unique_appointments"),
        func.sum(Commission.service_value).label("total_revenue"),
        func.sum(Commission.commission_value).label("total_commission")
    ).filter(
        Commission.professional_id == professional_id,
        Commission.tenant_id == current_user.tenant_id
    ).first()

    # Recent commissions
    recent = db.query(Commission).filter(
        Commission.professional_id == professional_id,
        Commission.tenant_id == current_user.tenant_id
    ).order_by(desc(Commission.created_at)).limit(10).all()

    return {
        "professional": {
            "name": prof.name,
            "commission_percentage": float(prof.commission_percentage)
        },
        "metrics": {
            "total_services": metrics.total_services or 0,
            "total_revenue": float(metrics.total_revenue or 0),
            "total_commission": float(metrics.total_commission or 0),
            "avg_ticket": float((metrics.total_revenue or 0) / (metrics.total_services or 1))
        },
        "recent_commissions": [
            {
                "id": str(c.id),
                "date": c.created_at.isoformat(),
                "service_value": float(c.service_value),
                "commission_value": float(c.commission_value),
                "status": c.status
            } for c in recent
        ]
    }
