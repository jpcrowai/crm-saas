
import subprocess
import time
import requests
import os
import signal
import sys

def test_login():
    # Caminho do backend
    backend_path = r"c:\Users\JOAO PEDRO\Desktop\CRM Saas\backend"
    
    print("🚀 Iniciando servidor local para teste...")
    
    # Inicia o uvicorn em um processo separado
    # Usamos o caminho absoluto e garantimos que o PYTHONPATH inclua o diretório atual
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_path
    
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8005"],
        cwd=backend_path,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Espera o servidor subir (máximo 15 segundos)
    start_time = time.time()
    server_ready = False
    while time.time() - start_time < 15:
        try:
            response = requests.get("http://127.0.0.1:8005/")
            if response.status_code == 200:
                server_ready = True
                break
        except:
            time.sleep(1)
    
    if not server_ready:
        print("❌ Erro: Servidor não iniciou a tempo.")
        # Pega o erro se houver
        out, err = process.communicate(timeout=1)
        print(f"STDOUT: {out}")
        print(f"STDERR: {err}")
        process.kill()
        return

    print("✅ Servidor online. Testando logins...")

    # 1. TESTE MASTER LOGIN
    master_data = {
        "email": "master@seucrm.com",
        "password": "Admin@123"
    }
    
    try:
        print(f"\n--- TESTE LOGIN MASTER ({master_data['email']}) ---")
        r_master = requests.post("http://127.0.0.1:8005/auth/login-master", json=master_data)
        print(f"Status: {r_master.status_code}")
        if r_master.status_code == 200:
            print("Resultado: SUCESSO! Login Master realizado.")
            print(f"Token: {r_master.json().get('access_token')[:20]}...")
        else:
            print(f"Resultado: FALHA. {r_master.text}")

        # 2. TESTE TENANT LOGIN
        tenant_data = {
            "email": "admin@agencia-growth.com",
            "password": "Admin@123",
            "tenant_slug": "agencia-growth"
        }
        print(f"\n--- TESTE LOGIN TENANT ({tenant_data['tenant_slug']}) ---")
        r_tenant = requests.post("http://127.0.0.1:8005/auth/login-tenant", json=tenant_data)
        print(f"Status: {r_tenant.status_code}")
        if r_tenant.status_code == 200:
            print("Resultado: SUCESSO! Login Tenant realizado.")
            print(f"Token: {r_tenant.json().get('access_token')[:20]}...")
        else:
            print(f"Resultado: FALHA. {r_tenant.text}")

    except Exception as e:
        print(f"❌ Erro durante a requisição: {e}")
    finally:
        print("\n🛑 Finalizando servidor de teste...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except:
            process.kill()

if __name__ == "__main__":
    test_login()
