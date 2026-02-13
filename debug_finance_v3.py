from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Use the credentials found in backend/.env which seem to be correct
DATABASE_URL = "postgresql://postgres.vmeerziytzluvqcijsib:CRMaster2026JP@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_finance_entries():
    print(f"Connecting to: {DATABASE_URL}")
    db = SessionLocal()
    try:
        # 1. Total Count using text() for raw SQL
        result = db.execute(text("SELECT COUNT(*) FROM public.finance_entries")).fetchone()
        print(f"Total entries in finance_entries table: {result[0]}")
        
        # 2. Schema check
        print("\nChecking first 5 rows raw data:")
        rows = db.execute(text("SELECT id, description, amount, status, type, due_date, tenant_id FROM public.finance_entries LIMIT 5")).fetchall()
        if not rows:
            print("No rows found.")
        for row in rows:
            print(f"Row: {row}")
            
        # 3. Check specific tenant
        print("\nUnique tenant_ids in finance_entries:")
        tenants = db.execute(text("SELECT DISTINCT tenant_id FROM public.finance_entries")).fetchall()
        for t in tenants:
            print(f"Tenant ID: {t[0]}")
            
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_finance_entries()
