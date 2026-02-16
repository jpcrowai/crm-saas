from passlib.context import CryptContext
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
new_hash = pwd_context.hash("Admin@123")

print(f"Gerando novo hash válido: {new_hash}")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    # Atualizar Master
    print("Atualizando Master...")
    cursor.execute("UPDATE public.users SET password_hash = %s WHERE email = 'master@seucrm.com'", (new_hash,))
    
    # Atualizar Dra. Silva
    print("Atualizando Dra. Silva...")
    cursor.execute("UPDATE public.users SET password_hash = %s WHERE email = 'dra.silva@fisiolife.com.br'", (new_hash,))
    
    # Atualizar Admin Agencia Growth (garantia)
    print("Atualizando Admin Agencia Growth...")
    cursor.execute("UPDATE public.users SET password_hash = %s WHERE email = 'admin@agencia-growth.com'", (new_hash,))
    
    conn.commit()
    print("✅ Todas as senhas resetadas para 'Admin@123' com hash válido!")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
