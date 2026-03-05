from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.models.sql_models import Lead, Customer, Appointment, FinanceEntry, Subscription
import uuid

class AIService:
    @staticmethod
    def get_churn_alerts(db: Session, tenant_id: uuid.UUID):
        """
        Detect customers who haven't had an appointment in 30+ days.
        """
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Subquery to find last appointment for each customer
        last_appt_sub = db.query(
            Appointment.customer_id,
            func.max(Appointment.start_time).label('last_date')
        ).filter(
            Appointment.tenant_id == tenant_id,
            Appointment.status == 'completed'
        ).group_by(Appointment.customer_id).subquery()

        # Join with Customer to find those with old or NO appointments
        # For simplicity in v1, let's find customers whose last appointment was > 30 days ago
        churn_candidates = db.query(Customer).join(
            last_appt_sub, Customer.id == last_appt_sub.c.customer_id
        ).filter(
            last_appt_sub.c.last_date < thirty_days_ago
        ).limit(5).all()

        alerts = []
        for cust in churn_candidates:
            alerts.append({
                "type": "churn_risk",
                "customer_name": cust.name,
                "customer_id": str(cust.id),
                "message": f"Sugerimos reativar o cliente {cust.name.split(' ')[0]} com uma oferta especial.",
                "severity": "medium",
                "action_label": "Mandar WhatsApp",
                "phone": cust.phone
            })
        
        return alerts

    @staticmethod
    def get_revenue_forecast(db: Session, tenant_id: uuid.UUID):
        """
        Predict revenue for the next 3 months based on historical data and subscriptions.
        """
        # 1. Monthly Recurring Revenue (MRR) from active subscriptions
        mrr = db.query(func.sum(Subscription.price)).filter(
            Subscription.tenant_id == tenant_id,
            Subscription.status == 'active'
        ).scalar() or 0.0

        # 2. Average individual sales revenue (non-subscription)
        # Get last 3 months average
        three_months_ago = datetime.now() - timedelta(days=90)
        avg_sales = db.query(func.sum(FinanceEntry.amount)).filter(
            FinanceEntry.tenant_id == tenant_id,
            FinanceEntry.type == 'receita',
            FinanceEntry.status == 'pago',
            FinanceEntry.origin == 'avulso',
            FinanceEntry.created_at >= three_months_ago
        ).scalar() or 0.0
        avg_monthly_sales = float(avg_sales) / 3.0

        # 3. Simple projection
        total_monthly_avg = float(mrr) + avg_monthly_sales
        
        return [
            {"month": "Próximo Mês", "forecast": round(total_monthly_avg * 1.05, 2)}, # 5% growth factor
            {"month": "Em 2 Meses", "forecast": round(total_monthly_avg * 1.10, 2)},
            {"month": "Em 3 Meses", "forecast": round(total_monthly_avg * 1.15, 2)}
        ]

    @staticmethod
    def get_sales_insights(db: Session, tenant_id: uuid.UUID):
        """
        Analyze funnel stages to find bottlenecks.
        """
        # Count leads per stage
        stages = db.query(
            Lead.funil_stage,
            func.count(Lead.id).label('count')
        ).filter(Lead.tenant_id == tenant_id).group_by(Lead.funil_stage).all()
        
        stage_counts = {s.funil_stage: s.count for s in stages}
        
        # Simple heuristic: if 'new' leads are > 50% but 'converted' is < 5%
        total = sum(stage_counts.values()) or 1
        new_perc = (stage_counts.get('new', 0) / total) * 100
        conv_perc = (stage_counts.get('converted', 0) / total) * 100
        
        insights = []
        if new_perc > 60:
            insights.append({
                "type": "bottleneck",
                "message": "Alta taxa de leads novos estagnados. Sugerimos campanha de primeiro contato.",
                "impact": "high"
            })
            
        return insights
