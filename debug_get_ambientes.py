import sys
import os
import json
import uuid
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.excel_service import read_sheet
from app.models.schemas import Environment

def debug():
    ambientes = read_sheet("ambientes", "ambientes")
    count = 0
    for i, a in enumerate(ambientes):
        try:
            slug = a.get("slug")
            if not slug: continue
            if not a.get("id"): a["id"] = str(uuid.uuid4())
            if not a.get("nome_empresa") and a.get("nome"): a["nome_empresa"] = a["nome"]
            if not a.get("nicho_id") and a.get("nicho"): a["nicho_id"] = a["nicho"]
            if a.get("modulos_habilitados") is None: a["modulos_habilitados"] = []
            elif isinstance(a.get("modulos_habilitados"), str):
                try: a["modulos_habilitados"] = json.loads(a["modulos_habilitados"])
                except: a["modulos_habilitados"] = []
            a.setdefault("cnpj", "")
            a.setdefault("endereco", "")
            a.setdefault("contract_status", "pending_generation")
            a.setdefault("contract_generated_url", None)
            a.setdefault("contract_signed_url", None)
            a.setdefault("ativo", False)
            a.setdefault("excel_file", f"{slug}.xlsx")
            a.setdefault("nome", a.get("nome_empresa", ""))
            Environment(**a)
            count += 1
        except Exception as e:
            print(f"Error index {i} ({a.get('slug')}): {e}")

    print(f"Valid: {count} / {len(ambientes)}")

if __name__ == "__main__":
    debug()
