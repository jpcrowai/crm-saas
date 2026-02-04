import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()
url = os.getenv("DATABASE_URL")
print(f"URL: {url}")

try:
    p = urlparse(url)
    print(f"Username: {p.username}")
    print(f"Password: {'*' * len(p.password) if p.password else 'None'}")
    print(f"Host: {p.hostname}")
    print(f"Port: {p.port}")
    print(f"DBName: {p.path[1:]}")
    
    conn = psycopg2.connect(url)
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
