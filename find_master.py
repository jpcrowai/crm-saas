import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.models.sql_models import User

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine)

def find_master():
    db = SessionLocal()
    masters = db.query(User).filter(User.is_master == True).all()
    if masters:
        print("Master accounts found:")
        for m in masters:
            print(f"Name: {m.name}, Email: {m.email}")
    else:
        print("No master account found.")
    db.close()

if __name__ == "__main__":
    find_master()
