from app.database import engine, Base
from sqlalchemy import text
import sys

# List of tables to drop (in order of dependencies)
tables_to_drop = [
    "appointments", "notifications", "integrations", "subscriptions",
    "pipeline_stages", "finance_entries", "finance_categories",
    "plan_items", "plans", "products", "leads", "users", "tenants"
]

try:
    with engine.connect() as conn:
        print("Dropping existing tables (if any)...")
        for table in tables_to_drop:
            conn.execute(text(f"DROP TABLE IF EXISTS public.{table} CASCADE;"))
        conn.commit()
        
        print("Creating tables based on new models...")
        Base.metadata.create_all(bind=engine)
        conn.commit()
        print("Tables created successfully!")

except Exception as e:
    print(f"Error during schema reset: {e}", file=sys.stderr)
    sys.exit(1)
