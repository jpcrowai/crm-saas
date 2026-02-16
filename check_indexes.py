import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    print("Verificando índices nas tabelas principais...")
    tables = ['tenants', 'users', 'leads_crm', 'finance_entries', 'customers']
    
    for table in tables:
        print(f"\nÍndices em '{table}':")
        cursor.execute(f"""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'public' AND tablename = '{table}';
        """)
        indexes = cursor.fetchall()
        for idx in indexes:
            print(f"- {idx[0]}: {idx[1]}")
            
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
