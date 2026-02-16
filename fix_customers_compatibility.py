import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

def fix_customers_table():
    try:
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        print("Checking customers columns...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'customers' AND table_schema = 'public';
        """)
        cols = [r[0] for r in cursor.fetchall()]
        
        required_cols = {
            'name': 'TEXT',
            'email': 'TEXT',
            'phone': 'TEXT',
            'document': 'TEXT',
            'address': 'TEXT',
            'lead_id': 'UUID'
        }
        
        mappings = {
            'nome': 'name',
            'telefone': 'phone',
            'documento': 'document',
            'cnpj': 'document',
            'endereco': 'address'
        }
        
        for old, new in mappings.items():
            if old in cols and new not in cols:
                print(f"Renaming {old} -> {new}...")
                cursor.execute(f"ALTER TABLE public.customers RENAME COLUMN {old} TO {new}")
                cols.remove(old)
                cols.append(new)

        for col, definition in required_cols.items():
            if col not in cols:
                print(f"Adding missing column: {col}...")
                cursor.execute(f"ALTER TABLE public.customers ADD COLUMN {col} {definition}")
        
        conn.commit()
        print("✅ customers table fixed!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    fix_customers_table()
