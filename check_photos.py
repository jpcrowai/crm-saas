import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

env_path = r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print(f"DATABASE_URL not found at {env_path}")
    exit(1)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def run_query(query):
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [dict(row._mapping) for row in result]

try:
    print("\n--- Professionals Photo URLs ---")
    profs = run_query("SELECT name, photo_url FROM public.professionals ORDER BY created_at DESC LIMIT 5")
    for p in profs:
        print(f"Name: {p['name']}, Photo: {p['photo_url']}")
        
    print("\n--- Suppliers Photo URLs ---")
    sups = run_query("SELECT name, photo_url FROM public.suppliers ORDER BY created_at DESC LIMIT 5")
    for s in sups:
        print(f"Name: {s['name']}, Photo: {s['photo_url']}")
        
except Exception as e:
    print(f"Error: {e}")
