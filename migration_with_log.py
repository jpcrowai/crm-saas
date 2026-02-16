import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

with open("migration_log.txt", "w") as f:
    try:
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads_crm' AND table_schema = 'public'")
        cols = [r[0] for r in cursor.fetchall()]
        f.write(f"Columns before: {cols}\n")
        
        mapping = {
            'nome': 'name',
            'telefone': 'phone',
            'valor': 'value',
            'origem': 'origin',
            'observacoes': 'observations',
            'responsavel': 'responsible_user'
        }
        
        for old, new in mapping.items():
            if old in cols and new not in cols:
                f.write(f"Renaming {old} to {new}...\n")
                cursor.execute(f"ALTER TABLE public.leads_crm RENAME COLUMN {old} TO {new}")
        
        conn.commit()
        
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads_crm' AND table_schema = 'public'")
        cols_after = [r[0] for r in cursor.fetchall()]
        f.write(f"Columns after: {cols_after}\n")
        
        cursor.close()
        conn.close()
    except Exception as e:
        f.write(f"Error: {e}\n")
