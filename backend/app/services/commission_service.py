from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.sql_models import Commission, Professional, Appointment, ProfessionalPerformance
from decimal import Decimal
from datetime import datetime

def calculate_commission(db: Session, appointment_id: str, tenant_id: str):
    # 1. Check for existing commission (Idempotency)
    existing = db.query(Commission).filter(
        Commission.appointment_id == appointment_id,
        Commission.tenant_id == tenant_id
    ).first()
    
    if existing:
        return existing

    # 2. Get Appointment details
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.tenant_id == tenant_id
    ).first()
    
    if not appt or not appt.professional_id:
        return None

    # 3. Get Professional rules
    prof = db.query(Professional).filter(
        Professional.id == appt.professional_id,
        Professional.tenant_id == tenant_id
    ).first()
    
    if not prof:
        return None

    percentage = Decimal(str(prof.commission_percentage or 0))
    if percentage <= 0:
        return None

    service_value = Decimal(str(appt.service_value or 0))
    commission_value = (service_value * percentage) / Decimal("100")

    # 4. Create Commission record
    new_commission = Commission(
        tenant_id=tenant_id,
        professional_id=prof.id,
        appointment_id=appt.id,
        service_id=appt.service_id,
        service_value=service_value,
        commission_percentage=percentage,
        commission_value=commission_value,
        status="pending"
    )
    db.add(new_commission)
    
    # 5. Update Performance Metrics
    update_performance_metrics(db, prof.id, tenant_id, service_value, commission_value)
    
    db.flush()
    return new_commission


def calculate_commission_from_subscription(db: Session, subscription_id: str, professional_id: str, tenant_id: str, subscription_value: Decimal):
    """
    Calculates and records a commission for a professional linked to a new subscription.
    Allows subscription revenue to appear in the commissions dashboard.
    """
    # 1. Idempotency check
    existing = db.query(Commission).filter(
        Commission.subscription_id == subscription_id,
        Commission.tenant_id == tenant_id
    ).first()
    if existing:
        return existing

    # 2. Get professional commission rules
    prof = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.tenant_id == tenant_id
    ).first()
    if not prof:
        return None

    percentage = Decimal(str(prof.commission_percentage or 0))
    if percentage <= 0:
        return None

    commission_value = (subscription_value * percentage) / Decimal("100")

    # 3. Create Commission record linked to the subscription
    new_commission = Commission(
        tenant_id=tenant_id,
        professional_id=prof.id,
        subscription_id=subscription_id,
        appointment_id=None,
        service_value=subscription_value,
        commission_percentage=percentage,
        commission_value=commission_value,
        status="pending"
    )
    db.add(new_commission)

    # 4. Update performance metrics
    update_performance_metrics(db, prof.id, tenant_id, subscription_value, commission_value)

    db.flush()
    return new_commission


def update_performance_metrics(db: Session, professional_id: str, tenant_id: str, service_value: Decimal, commission_value: Decimal):
    period = datetime.now().strftime("%Y-%m")
    
    perf = db.query(ProfessionalPerformance).filter(
        ProfessionalPerformance.professional_id == professional_id,
        ProfessionalPerformance.tenant_id == tenant_id,
        ProfessionalPerformance.period == period
    ).first()
    
    if not perf:
        perf = ProfessionalPerformance(
            tenant_id=tenant_id,
            professional_id=professional_id,
            period=period,
            total_services=1,
            total_customers=1,
            total_revenue=service_value,
            total_commission=commission_value
        )
        db.add(perf)
    else:
        perf.total_services += 1
        perf.total_revenue = Decimal(str(perf.total_revenue)) + service_value
        perf.total_commission = Decimal(str(perf.total_commission)) + commission_value
