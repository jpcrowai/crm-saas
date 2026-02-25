import os
import psycopg2
from dotenv import load_dotenv

# Load backend .env for DB URL
load_dotenv(r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def check_agencia_details():
    tenant_id = 'a8509002-6093-4e12-9c7c-f9a8b788cd1c'
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check professionals
        cur.execute("SELECT id, name FROM professionals WHERE tenant_id = %s;", (tenant_id,))
        profs = cur.fetchall()
        print(f"Professionals: {profs}")
        
        # Check products/services
        cur.execute("SELECT id, name, type, price FROM products WHERE tenant_id = %s;", (tenant_id,))
        prods = cur.fetchall()
        print(f"Products/Services: {prods}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_agencia_details()
