from app.database import SessionLocal
from app.models.sql_models import Lead as SQLLead
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

def test_query():
    db = SessionLocal()
    try:
        tenant_id = 'a8509002-6093-4e12-9c7c-f9a8b788cd1c'
        print(f"Testing counts for tenant {tenant_id}...")
        count = db.query(SQLLead).filter(SQLLead.tenant_id == tenant_id).count()
        print(f"✅ Success! Total leads: {count}")
    except Exception as e:
        import traceback
        print("❌ Still failing:")
        print(traceback.format_exc())
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
