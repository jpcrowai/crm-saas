import sys
import os

# Adiciona o diretório atual ao sys.path para importar app
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.sql_models import User, Tenant

def check_user():
    db = SessionLocal()
    email = "admin@agencia-growth.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"User {email} not found")
        return

    print(f"User found: {user.email}")
    print(f"Tenant ID: {user.tenant_id}")
    print(f"Password hash: {repr(user.password_hash)}")
    
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if tenant:
        print(f"Tenant slug: {tenant.slug}")
    else:
        print("Tenant not found for this user")
    
    db.close()

if __name__ == "__main__":
    check_user()
