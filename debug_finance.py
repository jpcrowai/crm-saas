from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Hardcode the DATABASE_URL to verify connection directly, as user env might be tricky
DATABASE_URL = "postgresql://postgres.dnhjccyillbfejcqscws:Jpj12345678@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_finance_entries():
    db = SessionLocal()
    try:
        # 1. Total Count
        result = db.execute("SELECT COUNT(*) FROM public.finance_entries").fetchone()
        print(f"Total entries in finance_entries table: {result[0]}")
        
        # 2. Schema check
        print("\nChecking first 5 rows raw data:")
        rows = db.execute("SELECT id, description, amount, status, type, due_date, tenant_id FROM public.finance_entries LIMIT 5").fetchall()
        for row in rows:
            print(f"Row: {row}")
            
        # 3. Check specific tenant (verify if tenant_id matches current user context)
        # We'll list unique tenant_ids to see if there's a mismatch
        print("\nUnique tenant_ids in finance_entries:")
        tenants = db.execute("SELECT DISTINCT tenant_id FROM public.finance_entries").fetchall()
        for t in tenants:
            print(f"Tenant ID: {t[0]}")
            
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_finance_entries()
