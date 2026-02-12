import sys
import os
import uuid
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path to import models and services
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.models.sql_models import Base, Tenant, User, Niche
from app.services.auth_service import get_password_hash
from app.database import engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_user_environment():
    db = SessionLocal()
    try:
        # 1. Ensure 'Consultoria' Niche exists
        niche_name = "Consultoria"
        niche = db.query(Niche).filter(Niche.name == niche_name).first()
        if not niche:
            niche = Niche(id=uuid.uuid4(), name=niche_name, description="Serviços de consultoria e agência")
            db.add(niche)
            db.commit()
            db.refresh(niche)
            print(f"Created niche: {niche_name}")
        else:
            print(f"Using existing niche: {niche_name}")

        # 2. Define User Environment
        env_slug = "agencia-growth"
        env_name = "Agência Growth"
        
        # Check if tenant already exists
        tenant = db.query(Tenant).filter(Tenant.slug == env_slug).first()
        if tenant:
            print(f"Environment '{env_slug}' already exists.")
        else:
            # Create Tenant
            all_modules = ["dashboard", "leads_pipeline", "agenda", "clientes", "equipe", "financeiro", "produtos", "assinaturas", "ai_agent"]
            
            tenant = Tenant(
                id=uuid.uuid4(),
                slug=env_slug,
                name=env_name,
                niche_id=niche.id,
                primary_color="#0f172a", # Dark/Professional color
                plan_tier="enterprise",
                payment_status="active",
                active=True,
                modulos_habilitados=all_modules
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"Created tenant: {env_name} ({env_slug})")

        # 3. Create Admin User
        admin_email = f"admin@{env_slug}.com"
        admin_pass = "Admin@123"
        hashed_pass = get_password_hash(admin_pass)
        
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            print(f"User '{admin_email}' already exists.")
            # If user exists, we might want to reset the password to be sure, but let's assume it's fine for now or print it.
            # actually let's update the password to be sure
            user.password_hash = hashed_pass
            db.commit()
            print(f"Updated password for {admin_email}")
        else:
            user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                email=admin_email,
                name="Admin",
                role="admin",
                password_hash=hashed_pass,
                is_master=False
            )
            db.add(user)
            db.commit()
            print(f"Created user: {admin_email}")

        print("\n" + "="*50)
        print("✅ AMBIENTE CRIADO COM SUCESSO!")
        print(f"Nome da Empresa: {env_name}")
        print(f"Link de Acesso (Login): /login") 
        print(f"Email: {admin_email}")
        print(f"Senha: {admin_pass}")
        print("="*50 + "\n")

    except Exception as e:
        db.rollback()
        print(f"Error creating environment: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user_environment()
