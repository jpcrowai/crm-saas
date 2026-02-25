import os
import psycopg2
from dotenv import load_dotenv
import uuid

# Load backend .env for DB URL
load_dotenv(r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def seed_agencia_customers():
    tenant_id = 'a8509002-6093-4e12-9c7c-f9a8b788cd1c'
    customers = [
        ("Pedro Alvares", "pedro@example.com", "11999999999"),
        ("Maria Souza", "maria@example.com", "11888888888"),
        ("Carlos Silva", "carlos@example.com", "11777777777"),
        ("Ana Oliveira", "ana@example.com", "11666666666")
    ]
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for name, email, phone in customers:
            cust_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO customers (id, tenant_id, name, email, phone)
                VALUES (%s, %s, %s, %s, %s)
            """, (cust_id, tenant_id, name, email, phone))
            
        conn.commit()
        print(f"Successfully seeded {len(customers)} customers for Agência Growth.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_agencia_customers()
