from sqlalchemy.orm import Session
from app.models.sql_models import Automation
from app.database import SessionLocal
import httpx
import asyncio

class AutomationService:
    @staticmethod
    def trigger_automations(tenant_id, trigger_type, payload):
        """
        Check and execute active automations for a given trigger.
        Opens its own DB session to avoid lifecycle issues.
        """
        db = SessionLocal()
        try:
            automations = db.query(Automation).filter(
                Automation.tenant_id == tenant_id,
                Automation.trigger_type == trigger_type,
                Automation.active == True
            ).all()

            for auto in automations:
                if auto.action_type == 'webhook':
                    asyncio.run(AutomationService._execute_webhook(auto, payload))
        finally:
            db.close()
            # Add other types here
            
    @staticmethod
    async def _execute_webhook(automation, payload):
        url = automation.action_config.get('url')
        if not url: return
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload, timeout=5.0)
                print(f"Webhook executed for {automation.name}")
        except Exception as e:
            print(f"Webhook failed for {automation.name}: {e}")
