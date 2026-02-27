import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Updating commissions table...")
    try:
        # Make appointment_id nullable and remove unique constraint if it was unique
        # We need to find the constraint name if it exists, or just try to drop it.
        # However, many times unique=True creates a unique index.
        # Let's just try to alter the column.
        conn.execute(text("ALTER TABLE public.commissions ALTER COLUMN appointment_id DROP NOT NULL;"))
        
        # Add subscription_id
        conn.execute(text("ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;"))
        
        conn.commit()
        print("Commissions table updated successfully.")
    except Exception as e:
        print(f"Error updating commissions table: {e}")
