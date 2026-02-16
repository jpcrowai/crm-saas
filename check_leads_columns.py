import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    print("Checking columns of leads_crm table...")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'leads_crm';
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"Column: {col[0]}, Type: {col[1]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
