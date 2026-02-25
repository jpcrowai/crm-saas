import os
import psycopg2
from dotenv import load_dotenv

# Load backend .env for DB URL
load_dotenv(r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def check_agencia_customers():
    tenant_id = 'a8509002-6093-4e12-9c7c-f9a8b788cd1c'
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check customers
        cur.execute("SELECT id, name FROM customers WHERE tenant_id = %s;", (tenant_id,))
        custs = cur.fetchall()
        print(f"Customers: {custs}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_agencia_customers()
