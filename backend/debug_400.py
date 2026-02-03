from app.database import SessionLocal
from app.models.sql_models import Tenant, Niche
import uuid

def check_existence():
    db = SessionLocal()
    try:
        slug = "crm-aster"
        nicho_id = "d6116ff8-7aa6-4bab-b482-7ad81812aa85"
        
        tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
        if tenant:
            print(f"Tenant with slug '{slug}' EXISTS. ID: {tenant.id}")
        else:
            print(f"Tenant with slug '{slug}' does NOT exist.")
            
        try:
            niche_uuid = uuid.UUID(nicho_id)
            niche = db.query(Niche).filter(Niche.id == niche_uuid).first()
            if niche:
                print(f"Niche with ID '{nicho_id}' EXISTS. Name: {niche.name}")
            else:
                print(f"Niche with ID '{nicho_id}' does NOT exist.")
        except ValueError:
            print(f"Provided niche_id '{nicho_id}' is NOT a valid UUID.")

    finally:
        db.close()

if __name__ == "__main__":
    check_existence()
