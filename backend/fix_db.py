from sqlalchemy import text
from app.database import engine

def fix_schema():
    with engine.begin() as conn:
        print("Dropping all tables to fix UUID mismatch...")
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        print("Schema dropped and recreated.")

if __name__ == "__main__":
    fix_schema()
