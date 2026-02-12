"""
Quick migration script to add modules_allowed column to users table
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

# Get database URL from environment
database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lifefy")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Add modules_allowed column
    print("Adding modules_allowed column to users table...")
    cursor.execute("""
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS modules_allowed JSON DEFAULT '[]'::json;
    """)
    
    # Update existing users to have empty array
    print("Setting default empty array for existing users...")
    cursor.execute("""
        UPDATE public.users 
        SET modules_allowed = '[]'::json 
        WHERE modules_allowed IS NULL;
    """)
    
    conn.commit()
    print("✅ Migration completed successfully!")
    print(f"   - Added 'modules_allowed' column to 'users' table")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error during migration: {e}")
    if 'conn' in locals():
        conn.rollback()
