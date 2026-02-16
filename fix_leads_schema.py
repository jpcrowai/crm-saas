import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

def migrate_leads_columns():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        # Check if 'nome' exists and 'name' doesn't
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'leads_crm';
        """)
        columns = [row[0] for row in cursor.fetchall()]
        
        if 'nome' in columns and 'name' not in columns:
            print("Renaming column 'nome' to 'name' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN nome TO name;")
        
        # Check for other potential mismatches
        # In SQL model: name, email, phone, funil_stage, value, origin, observations, responsible_user
        
        if 'telefone' in columns and 'phone' not in columns:
            print("Renaming column 'telefone' to 'phone' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN telefone TO phone;")

        if 'valor' in columns and 'value' not in columns:
            print("Renaming column 'valor' to 'value' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN valor TO value;")
            
        if 'origem' in columns and 'origin' not in columns:
            print("Renaming column 'origem' to 'origin' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN origem TO origin;")

        if 'observacoes' in columns and 'observations' not in columns:
            print("Renaming column 'observacoes' to 'observations' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN observacoes TO observations;")

        if 'responsavel' in columns and 'responsible_user' not in columns:
            print("Renaming column 'responsavel' to 'responsible_user' in leads_crm table...")
            cursor.execute("ALTER TABLE public.leads_crm RENAME COLUMN responsavel TO responsible_user;")

        conn.commit()
        print("✅ Column migration completed successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    migrate_leads_columns()
