from services.excel_service import init_excel_file, write_sheet
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def init_db():
    # Initialize master.xlsx
    # Planilha: users_master
    # Colunas: email, name, role_global, allowed_tenants
    init_excel_file("master", {
        "users_master": ["email", "name", "role_global", "allowed_tenants"]
    })
    
    # Check if master user needs to be added (simple check if file empty effectively handled by init)
    # But init_excel_file doesn't check if data exists, just file/sheet structure.
    # Let's write the master user.
    
    master_hash = pwd_context.hash("Teste@123")
    
    master_user = {
        "email": "master@seucrm.com",
        "name": "Master Admin",
        "role_global": "master",
        "allowed_tenants": ""
    }
    
    # We should read first to avoid duplicates, but for now we just overwrite in this init script logic
    # or separate "seed" logic. Let's just write this single user.
    write_sheet("master", "users_master", [master_user])
    
    # Initialize ambientes.xlsx
    # Planilha: ambientes
    # Colunas: id, slug, nome, excel_file, logo_url, nicho, cor_principal, ativo
    init_excel_file("ambientes", {
        "ambientes": ["id", "slug", "nome", "excel_file", "logo_url", "nicho", "cor_principal", "ativo"]
    })
    
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
