import asyncio
from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models.sql_models import Tenant, User, generate_uuid
from app.services.auth_service import get_password_hash

def seed_demo_data():
    with engine.begin() as conn:
        print("Recreating tables to ensure schema loaded correctly...")
        Base.metadata.create_all(conn)
    
    with Session(engine) as db:
        print("Checking for existing demo-nutri tenant...")
        tenant = db.query(Tenant).filter(Tenant.slug == 'demo-nutri').first()
        
        if not tenant:
            print("Creating demo-nutri tenant...")
            tenant = Tenant(
                slug='demo-nutri',
                name='Demo Nutrição',
                business_name='Demo Nutrição LTDA',
                document='12345678000199',
                plan_tier='enterprise',
                payment_status='active',
                modulos_habilitados=['dashboard', 'clientes', 'equipe', 'agenda', 'financeiro']
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        print("Checking for admin@nutri.com user...")
        user = db.query(User).filter(User.email == 'admin@nutri.com').first()
        if not user:
            print("Creating admin@nutri.com user...")
            hashed_pw = get_password_hash('Admin@123')
            user = User(
                tenant_id=tenant.id,
                email='admin@nutri.com',
                name='Administrador Nutri',
                password_hash=hashed_pw,
                role='admin',
                modules_allowed=tenant.modulos_habilitados
            )
            db.add(user)
            db.commit()
            print("Seed completed successfully!")
        else:
            print("User already exists.")

if __name__ == "__main__":
    seed_demo_data()
