"""
Script para criar ambiente demo de Fisioterapia via API local
Execute o backend primeiro: uvicorn app.main:app --reload
"""
import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:8000"

# Dados do ambiente demo
DEMO_DATA = {
    "tenant": {
        "nome": "FisioLife - Clínica de Fisioterapia",
        "slug": "fisiolife-demo",
        "niche": "fisioterapia",
        "plan": "trial"
    },
    "admin": {
        "nome": "Dra. Maria Silva",
        "email": "dra.silva@fisiolife.com.br",
        "password": "demo123",
        "role": "admin"
    },
    "pacientes": [
        {"nome": "João Carlos Oliveira", "email": "joao.oliveira@email.com", "telefone": "(11) 98765-4321"},
        {"nome": "Ana Paula Santos", "email": "ana.santos@email.com", "telefone": "(11) 97654-3210"},
        {"nome": "Pedro Henrique Lima", "email": "pedro.lima@email.com", "telefone": "(11) 96543-2109"},
        {"nome": "Mariana Costa", "email": "mariana.costa@email.com", "telefone": "(11) 95432-1098"},
        {"nome": "Carlos Eduardo Souza", "email": "carlos.souza@email.com", "telefone": "(11) 94321-0987"},
    ],
    "servicos": [
        {"nome": "Avaliação Fisioterapêutica", "valor": 150.00},
        {"nome": "Sessão de RPG", "valor": 180.00},
        {"nome": "Sessão de Pilates", "valor": 120.00},
        {"nome": "Fisioterapia Ortopédica", "valor": 160.00},
        {"nome": "Fisioterapia Respiratória", "valor": 140.00},
    ]
}

def create_fisio_demo():
    print("🏥 Iniciando criação do ambiente demo FisioLife...")
    print("⚠️  Certifique-se de que o backend está rodando em http://localhost:8000")
    print()
    
    try:
        # 1. Verificar se API está online
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print("❌ Backend não está respondendo. Execute: uvicorn app.main:app --reload")
            return
        
        print("✅ Backend está online")
        
        # 2. TODO: Criar tenant via API master (requer implementação no backend)
        # Por enquanto, vamos assumir que o tenant já existe
        
        print("\n📝 PRÓXIMOS PASSOS MANUAIS:")
        print("=" * 60)
        print("1. Acesse o painel Master da plataforma")
        print("2. Crie um novo ambiente com os dados:")
        print(f"   Nome: {DEMO_DATA['tenant']['nome']}")
        print(f"   Slug: {DEMO_DATA['tenant']['slug']}")
        print(f"   Nicho: {DEMO_DATA['tenant']['niche']}")
        print(f"\n3. Crie o usuário administrador:")
        print(f"   Nome: {DEMO_DATA['admin']['nome']}")
        print(f"   Email: {DEMO_DATA['admin']['email']}")
        print(f"   Senha: {DEMO_DATA['admin']['password']}")
        print("\n4. Após criar, faça login e eu posso popular os dados via API")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao backend")
        print("Execute: cd backend && uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    create_fisio_demo()
