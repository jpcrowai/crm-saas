from app.database import SessionLocal
from app.models.sql_models import Tenant
from app.models.schemas import Environment
from typing import List
import json

def debug_list():
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).all()
        print(f"Found {len(tenants)} tenants in database.")
        
        valid_ambientes = []
        for t in tenants:
            print(f"Processing tenant: {t.slug}")
            try:
                processed = {
                    "id": str(t.id),
                    "slug": t.slug,
                    "nome_empresa": t.name,
                    "cnpj": t.document or "",
                    "endereco": t.address or "",
                    "nicho_id": str(t.niche_id) if t.niche_id else "",
                    "logo_url": t.logo_url,
                    "cor_principal": t.primary_color or "#d4af37",
                    "plan": t.plan_tier or "basic",
                    "payment_status": t.payment_status or "trial",
                    "contract_generated_url": t.contract_generated_url,
                    "contract_signed_url": t.contract_signed_url,
                    "contract_status": t.contract_status or "pending_generation",
                    "ativo": t.active,
                    "excel_file": f"{t.slug}.xlsx",
                    "nome": t.name,
                    "modulos_habilitados": []
                }
                env = Environment(**processed)
                valid_ambientes.append(env)
                print(f"Successfully validated {t.slug}")
            except Exception as e:
                print(f"Validation Error for {t.slug}: {e}")
        
        print(f"Total valid ambientes: {len(valid_ambientes)}")
        if valid_ambientes:
            print("First item sample:")
            print(json.dumps(valid_ambientes[0].model_dump(), indent=2, default=str))

    finally:
        db.close()

if __name__ == "__main__":
    debug_list()
