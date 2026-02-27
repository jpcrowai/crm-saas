import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding professional_id to subscriptions table...")
    try:
        conn.execute(text("ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;"))
        conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Error adding column: {e}")
