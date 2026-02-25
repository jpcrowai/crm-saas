import os
import psycopg2
from dotenv import load_dotenv

# Load backend .env for DB URL
load_dotenv(r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def check_agencia():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check tenants
        cur.execute("SELECT id, slug, name FROM tenants WHERE slug LIKE '%growth%' OR name LIKE '%Growth%';")
        tenants = cur.fetchall()
        print(f"Tenants found: {tenants}")
        
        if tenants:
            tenant_id = tenants[0][0]
            # Check products for this tenant
            cur.execute("SELECT id, name, category, price FROM products WHERE tenant_id = %s;", (tenant_id,))
            products = cur.fetchall()
            print(f"Products for {tenants[0][2]}: {products}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_agencia()
