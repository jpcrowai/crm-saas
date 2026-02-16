import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    slug = 'fisiolife'
    print(f"Buscando dados do tenant: {slug}")
    
    cursor.execute("SELECT id, name FROM public.tenants WHERE slug = %s", (slug,))
    tenant = cursor.fetchone()
    
    if tenant:
        tenant_id = tenant[0]
        print(f"✅ Ambiente encontrado: {tenant[1]} (ID: {tenant_id})")
        
        cursor.execute("SELECT email, name, role FROM public.users WHERE tenant_id = %s", (tenant_id,))
        users = cursor.fetchall()
        
        if users:
            print("\nUsuários encontrados:")
            for user in users:
                print(f"- Nome: {user[1]} | E-mail: {user[0]} | Role: {user[2]}")
        else:
            print("\n❌ Nenhum usuário encontrado para este ambiente.")
    else:
        print(f"\n❌ Ambiente '{slug}' não encontrado no banco de dados.")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
