import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'leads_crm';
    """)
    columns = [row[0] for row in cursor.fetchall()]
    print(f"Leads CRM Columns: {columns}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
