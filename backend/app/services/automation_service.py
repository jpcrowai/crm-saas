from sqlalchemy.orm import Session
from app.models.sql_models import Automation
from app.database import SessionLocal
import httpx
import asyncio

import os

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
                    asyncio.run(AutomationService._execute_webhook(auto.action_config.get('url'), payload))
        finally:
            db.close()
            
    @staticmethod
    def trigger_master_automation(trigger_type, payload):
        """
        Triggers master-level automations (e.g., environment creation).
        Currently uses N8N_MASTER_WEBHOOK_URL globally.
        """
        webhook_url = os.getenv("N8N_MASTER_WEBHOOK_URL")
        if not webhook_url:
            print("MASTER WEBHOOK skipped: N8N_MASTER_WEBHOOK_URL not set.")
            return
            
        asyncio.run(AutomationService._execute_webhook(webhook_url, payload))

    @staticmethod
    async def _execute_webhook(url, payload):
        if not url: return
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload, timeout=5.0)
                print(f"Webhook executed for {url}")
        except Exception as e:
            print(f"Webhook failed for {url}: {e}")
