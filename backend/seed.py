from app.database import SessionLocal, engine, Base
from app.models.sql_models import User, Tenant
from app.services.auth_service import get_password_hash
import uuid

from sqlalchemy import text

def seed_db():
    print("Creating schema and tables...")
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS crm"))
        conn.commit()
    
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        from app.models.sql_models import Niche
        
        # 1. Create default niche
        default_niche = db.query(Niche).filter(Niche.name == "Geral").first()
        if not default_niche:
            print("Creating default niche: Geral")
            default_niche = Niche(
                name="Geral",
                description="Nicho geral para diversos segmentos"
            )
            db.add(default_niche)
            db.commit()
            db.refresh(default_niche)
        
        # 2. Create Master User
        master_email = "master@seucrm.com"
        existing_master = db.query(User).filter(User.email == master_email).first()
        
        if not existing_master:
            print(f"Creating master user: {master_email}")
            master = User(
                email=master_email,
                name="Master Admin",
                password_hash=get_password_hash("Teste@123"),
                role="admin",
                is_master=True
            )
            db.add(master)
        else:
            print("Master user already exists.")
            
        # 3. Create Demo Tenant
        demo_slug = "demo-tenant"
        existing_tenant = db.query(Tenant).filter(Tenant.slug == demo_slug).first()
        
        if not existing_tenant:
            print(f"Creating demo tenant: {demo_slug}")
            tenant = Tenant(
                slug=demo_slug,
                name="Ambiente de Demonstração",
                primary_color="#0055FF",
                active=True,
                niche_id=default_niche.id
            )
            db.add(tenant)
            db.flush() # get ID
            
            # Create a user for this tenant
            tenant_user = User(
                email="admin@demo.com",
                name="Admin Demo",
                password_hash=get_password_hash("123456"),
                role="admin",
                tenant_id=tenant.id
            )
            db.add(tenant_user)
            
        db.commit()
        print("Seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
