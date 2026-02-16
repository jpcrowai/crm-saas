import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT table_schema, column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads_crm' 
        ORDER BY table_schema, ordinal_position;
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Schema: {row[0]}, Column: {row[1]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
