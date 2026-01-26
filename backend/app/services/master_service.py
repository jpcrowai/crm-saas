import uuid
from openpyxl import Workbook
from app.services.excel_service import read_sheet, write_sheet

# backend/app/services/master_service.py
def get_master_user(email: str):
    """
    Função exemplo para retornar usuário master.
    Aqui você poderia ler o Excel master.xlsx ou usar hardcoded.
    """
    if email == "master@seucrm.com":
        return {"email": email, "role_global": "master"}
    return None

def listar_ambientes():
    return read_sheet("ambientes.xlsx", "ambientes")

def criar_ambiente(data: dict):
    ambientes = read_sheet("ambientes.xlsx", "ambientes")

    novo = {
        "id": str(uuid.uuid4()),
        "slug": data["slug"],
        "nome": data["nome"],
        "excel_file": f"{data['slug']}.xlsx",
        "logo_url": data.get("logo_url"),
        "nicho": data.get("nicho"),
        "cor_principal": data.get("cor_principal"),
        "ativo": True
    }

    ambientes.append(novo)
    write_sheet("ambientes.xlsx", "ambientes", ambientes)

    # cria excel do tenant
    wb = Workbook()
    ws = wb.active
    ws.title = "users"
    ws.append(["id", "email", "name", "role", "password_hash"])
    wb.save(f"backend/excel/{data['slug']}.xlsx")

    return novo
