import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

database_url = os.getenv("DATABASE_URL")

def run_migration():
    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        # 1. Add modules_allowed to users
        print("Checking 'modules_allowed' in 'users' table...")
        cursor.execute("""
            ALTER TABLE public.users 
            ADD COLUMN IF NOT EXISTS modules_allowed JSON DEFAULT '[]'::json;
        """)
        
        # 2. Add modulos_habilitados to tenants
        print("Checking 'modulos_habilitados' in 'tenants' table...")
        cursor.execute("""
            ALTER TABLE public.tenants 
            ADD COLUMN IF NOT EXISTS modulos_habilitados JSON DEFAULT '[]'::json;
        """)
        
        # 3. Add active to tenants (just in case)
        print("Checking 'active' in 'tenants' table...")
        cursor.execute("""
            ALTER TABLE public.tenants 
            ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
        """)

        # 4. Add is_master to users (just in case)
        print("Checking 'is_master' in 'users' table...")
        cursor.execute("""
            ALTER TABLE public.users 
            ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;
        """)
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    run_migration()
