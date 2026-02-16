import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

def fix_leads_table():
    try:
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        print("Checking leads_crm columns...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'leads_crm' AND table_schema = 'public';
        """)
        cols = [r[0] for r in cursor.fetchall()]
        
        # Required columns for the SQLAlchemy model
        required_cols = {
            'name': 'TEXT',
            'email': 'TEXT',
            'phone': 'TEXT',
            'funil_stage': 'TEXT DEFAULT \'new\'',
            'value': 'NUMERIC(12, 2) DEFAULT 0.0',
            'origin': 'TEXT',
            'observations': 'TEXT',
            'responsible_user': 'TEXT'
        }
        
        # Mappings from EXISTING columns if any
        mappings = {
            'nome': 'name',
            'telefone': 'phone',
            'whatsapp': 'phone', # If phone missing but whatsapp exists
            'valor_total_gasto': 'value',
            'resumo_conversa': 'observations'
        }
        
        for old, new in mappings.items():
            if old in cols and new not in cols:
                print(f"Renaming {old} -> {new}...")
                cursor.execute(f"ALTER TABLE public.leads_crm RENAME COLUMN {old} TO {new}")
                cols.remove(old)
                cols.append(new)

        for col, definition in required_cols.items():
            if col not in cols:
                print(f"Adding missing column: {col}...")
                cursor.execute(f"ALTER TABLE public.leads_crm ADD COLUMN {col} {definition}")
        
        conn.commit()
        print("✅ leads_crm table is now compatible with the SQLAlchemy model!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_leads_table()
