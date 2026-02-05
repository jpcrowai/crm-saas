from sqlalchemy import text
import sys
import os
sys.path.append(os.getcwd())
from app.database import engine

def migrate():
    commands = [
        # 1. Add columns to Products
        "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'product';",
        "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;",
        
        # 2. Cleanup Appointments constraint
        "ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_service_id_fkey;",
        "ALTER TABLE public.appointments ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.products(id) ON DELETE RESTRICT;",
        
        # 3. Update existing records to be 'service' if they were linked to appointments (optional)
        "UPDATE public.products SET type = 'service' WHERE id IN (SELECT service_id FROM public.appointments WHERE service_id IS NOT NULL);"
    ]

    print("--- Starting Unification Migration ---")
    with engine.begin() as conn:
        for cmd in commands:
            print(f"Executing: {cmd}")
            try:
                conn.execute(text(cmd))
            except Exception as e:
                print(f"Error: {e}")
    print("--- Migration Finished ---")

if __name__ == "__main__":
    migrate()
