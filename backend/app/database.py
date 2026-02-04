from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Format: postgresql://USER:PASSWORD@HOST:PORT/DBNAME
# Supabase Transaction Pooler (Recommended for Serverless/Lambda, but direct works too)
# Example: postgresql://postgres:password@db.projectref.supabase.co:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("WARNING: DATABASE_URL not set in .env")
    DATABASE_URL = "postgresql://user:password@localhost/dbname"

if DATABASE_URL:
    try:
        from urllib.parse import urlparse
        p = urlparse(DATABASE_URL)
        print(f"DEBUG: Connecting to {p.hostname}:{p.port} as {p.username}")
    except:
        pass

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
