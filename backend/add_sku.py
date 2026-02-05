from sqlalchemy import text
import sys
import os
sys.path.append(os.getcwd())
from app.database import engine

def migrate_sku():
    commands = [
        "ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku VARCHAR;"
    ]

    print("--- Adding SKU Column ---")
    with engine.begin() as conn:
        for cmd in commands:
            print(f"Executing: {cmd}")
            try:
                conn.execute(text(cmd))
            except Exception as e:
                print(f"Error: {e}")
    print("--- SKU Added ---")

if __name__ == "__main__":
    migrate_sku()
