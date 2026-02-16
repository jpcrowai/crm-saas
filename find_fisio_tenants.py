import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    print("Buscando ambientes relacionados a 'fisio':")
    cursor.execute("SELECT slug, name FROM public.tenants WHERE slug ILIKE '%%fisio%%'")
    tenants = cursor.fetchall()
    
    for t in tenants:
        print(f"Slug: {t[0]} | Nome: {t[1]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
