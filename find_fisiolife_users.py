import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    slug = 'fisiolife-demo'
    cursor.execute("SELECT id, name FROM public.tenants WHERE slug = %s", (slug,))
    tenant = cursor.fetchone()
    
    if tenant:
        print(f"✅ Ambiente: {tenant[1]}")
        cursor.execute("SELECT email, name, role FROM public.users WHERE tenant_id = %s", (tenant[0],))
        users = cursor.fetchall()
        for user in users:
            print(f"- E-mail: {user[0]} | Nome: {user[1]} | Role: {user[2]}")
    else:
        print("❌ Não encontrado.")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
