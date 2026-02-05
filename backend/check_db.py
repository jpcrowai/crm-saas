from sqlalchemy import text
import sys
import os
sys.path.append(os.getcwd())
from app.database import engine

def check():
    with engine.connect() as conn:
        try:
            result = conn.execute(text("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'public.appointments'::regclass;
            """))
            print("Constraints for appointments:")
            for row in result:
                print(f" - {row[0]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check()
