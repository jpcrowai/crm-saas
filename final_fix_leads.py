import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    # Check
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads_crm' AND table_schema = 'public'")
    cols = [r[0] for r in cursor.fetchall()]
    print(f"Current columns: {cols}")
    
    if 'nome' in cols:
        print("Renaming 'nome' -> 'name'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN nome TO name")
    
    if 'telefone' in cols:
        print("Renaming 'telefone' -> 'phone'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN telefone TO phone")

    if 'valor' in cols:
        print("Renaming 'valor' -> 'value'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN valor TO value")

    if 'origem' in cols:
        print("Renaming 'origem' -> 'origin'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN origem TO origin")
        
    if 'observacoes' in cols:
        print("Renaming 'observacoes' -> 'observations'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN observacoes TO observations")

    if 'responsavel' in cols:
        print("Renaming 'responsavel' -> 'responsible_user'...")
        cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN responsavel TO responsible_user")

    conn.commit()
    
    # Verify
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads_crm' AND table_schema = 'public'")
    after = [r[0] for r in cursor.fetchall()]
    print(f"Columns after: {after}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
