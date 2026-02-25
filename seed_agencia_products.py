import os
import psycopg2
from dotenv import load_dotenv
import uuid

# Load backend .env for DB URL
load_dotenv(r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend\.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def seed_agencia_products():
    tenant_id = 'a8509002-6093-4e12-9c7c-f9a8b788cd1c'
    products = [
        ("Implementação CRM", "Setup completo da plataforma LifeFy", 2500.00, "service"),
        ("Consultoria de Vendas", "Otimização de processos comerciais", 1500.00, "service"),
        ("Automação de Marketing", "Integração e fluxos automáticos", 3500.00, "service"),
        ("Suporte Premium 24/7", "Acompanhamento dedicado", 500.00, "service"),
        ("Treinamento de Equipe", "Workshop presencial ou online", 1200.00, "service")
    ]
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for name, desc, price, ptype in products:
            product_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO products (id, tenant_id, name, description, price, type, active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (product_id, tenant_id, name, desc, price, ptype, True))
            
        conn.commit()
        print(f"Successfully seeded {len(products)} products for Agência Growth.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_agencia_products()
