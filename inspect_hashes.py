import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url, sslmode='require')
    cursor = conn.cursor()
    
    print("Verificando hashes de senha (precisam começar com $pbkdf2-sha256$ ou $2b$):")
    
    # Check Fisiolife User
    cursor.execute("SELECT email, password_hash FROM public.users WHERE email = 'dra.silva@fisiolife.com.br'")
    user = cursor.fetchone()
    if user:
        print(f"Fisiolife: {user[0]} -> {user[1]}")
    
    # Check Master User
    cursor.execute("SELECT email, password_hash FROM public.users WHERE email = 'master@seucrm.com'")
    master = cursor.fetchone()
    if master:
        print(f"Master: {master[0]} -> {master[1]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
