from app.database import SessionLocal
from app.services.auth_service import authenticate_tenant_user, authenticate_master
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

def test_logins():
    db = SessionLocal()
    try:
        # 1. Testar Fisiolife
        email_f = 'dra.silva@fisiolife.com.br'
        pass_f = 'Admin@123'
        slug_f = 'fisiolife-demo'
        
        print(f"--- Testando Fisiolife ({slug_f}) ---")
        user_f = authenticate_tenant_user(db, slug_f, email_f, pass_f)
        if user_f:
            print(f"✅ Fisiolife OK: {user_f}")
        else:
            print("❌ Fisiolife FALHOU")

        # 2. Testar Master
        email_m = 'master@seucrm.com'
        pass_m = 'Admin@123'
        
        print(f"\n--- Testando Master ---")
        user_m = authenticate_master(db, email_m, pass_m)
        if user_m:
            print(f"✅ Master OK: {user_m}")
        else:
            # Tentar senha antiga caso não tenha sido resetada
            print("❌ Master FALHOU com Admin@123, tentando Teste@123...")
            user_m_alt = authenticate_master(db, email_m, 'Teste@123')
            if user_m_alt:
                print(f"✅ Master OK com Teste@123: {user_m_alt}")
            else:
                print("❌ Master FALHOU com ambas as senhas")
                
    except Exception as e:
        import traceback
        print(f"💥 ERRO: {traceback.format_exc()}")
    finally:
        db.close()

if __name__ == "__main__":
    test_logins()
