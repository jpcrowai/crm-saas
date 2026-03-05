from sqlalchemy.orm import Session
from app.models.sql_models import Subscription, FinanceEntry
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import uuid

class BillingService:
    @staticmethod
    def generate_future_entries(db: Session, subscription: Subscription, months_ahead: int = 12):
        """
        Generates pending financial entries for the next X months of a subscription.
        """
        # Ensure we don't duplicate for the same dates
        existing_entries = db.query(FinanceEntry).filter(
            FinanceEntry.subscription_id == subscription.id
        ).all()
        existing_dates = {e.due_date for e in existing_entries}

        start_date = subscription.start_date or date.today()
        
        for i in range(months_ahead):
            # Calculate due date based on periodicity
            if subscription.periodicity == 'monthly':
                due_date = start_date + relativedelta(months=i)
            elif subscription.periodicity == 'weekly':
                due_date = start_date + relativedelta(weeks=i)
            elif subscription.periodicity == 'yearly':
                due_date = start_date + relativedelta(years=i)
            else:
                due_date = start_date + relativedelta(months=i)

            if due_date not in existing_dates:
                new_entry = FinanceEntry(
                    tenant_id=subscription.tenant_id,
                    customer_id=subscription.customer_id,
                    subscription_id=subscription.id,
                    type='receita',
                    description=f"Assinatura: {subscription.plan.name if subscription.plan else 'Plano'} - {due_date.strftime('%m/%Y')}",
                    origin='assinatura',
                    amount=subscription.price,
                    due_date=due_date,
                    status='pendente'
                )
                db.add(new_entry)
        
        db.commit()

    @staticmethod
    def sync_subscription_finances(db: Session, subscription: Subscription):
        """
        Syncs future entries if price or status changes. 
        Updates only 'pendente' or 'atrasado' entries.
        """
        today = date.today()
        db.query(FinanceEntry).filter(
            FinanceEntry.subscription_id == subscription.id,
            FinanceEntry.due_date >= today,
            FinanceEntry.status.in_(['pendente', 'atrasado'])
        ).update({
            "amount": subscription.price,
            "description": f"Assinatura: {subscription.plan.name if subscription.plan else 'Plano'} - Atualizada"
        }, synchronize_session='fetch')
        
        # If subscription is cancelled, maybe delete or mark future entries
        if subscription.status.lower() in ['cancelada', 'cancelled', 'inativo']:
             db.query(FinanceEntry).filter(
                FinanceEntry.subscription_id == subscription.id,
                FinanceEntry.due_date > today,
                FinanceEntry.status == 'pendente'
            ).delete()

        db.commit()
