import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
# Manual split of URL: postgresql://USER:PASS@HOST:PORT/DB
# postgresql://postgres.ref:pass@host:6543/postgres

user = "postgres.vmeerziytzluvqcijsib"
password = "SWDfIV9CnGJYfbhk"
host = "aws-1-sa-east-1.pooler.supabase.com"
port = "6543"
dbname = "postgres"

try:
    print(f"Connecting to {host} as {user}...")
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    print("SUCCESS!")
    conn.close()
except Exception as e:
    print(f"FAILED: {e}")
