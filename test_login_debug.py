import sys
import os

# Adiciona o diretório atual ao sys.path para importar app
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.sql_models import User, Tenant
from app.services.auth_service import verify_password

def test_login_locally():
    db = SessionLocal()
    email = "admin@agencia-growth.com"
    password = "Admin@123"
    tenant_slug = "agencia-growth"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"User {email} not found")
        return

    print(f"Testing login for {email}")
    try:
        is_match = verify_password(password, user.password_hash)
        print(f"Password match: {is_match}")
    except Exception as e:
        print(f"Error during verification: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    db.close()

if __name__ == "__main__":
    test_login_locally()
