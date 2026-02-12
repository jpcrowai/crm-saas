import sys
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.models.sql_models import User
from app.services.auth_service import get_password_hash

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed_master():
    db = SessionLocal()
    try:
        email = "master@seucrm.com"
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User {email} already exists. Updating password and ensuring is_master.")
            existing.password_hash = get_password_hash("Teste@123")
            existing.is_master = True
            db.commit()
        else:
            new_master = User(
                id=uuid.uuid4(),
                email=email,
                name="Master Admin",
                password_hash=get_password_hash("Teste@123"),
                role="master",
                is_master=True
            )
            db.add(new_master)
            db.commit()
            print(f"Master user {email} created successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_master()
