import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import sys

load_dotenv()
url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {url.split('@')[-1] if url else 'MISSING'}")

try:
    engine = create_engine(url)
    with engine.connect() as conn:
        print("Successfully connected!")
        result = conn.execute(text("SELECT version();"))
        print(f"Versão do DB: {result.fetchone()[0]}")
except Exception as e:
    print(f"Detailed Error: {e}")
    import traceback
    traceback.print_exc()
