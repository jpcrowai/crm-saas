"""
Criar ambiente FisioLife usando a API REST do Supabase
"""
import requests
import json
from datetime import datetime, timedelta
import random
import uuid

# Configuração do Supabase
SUPABASE_URL = "https://vmeerziytzluvqcijsib.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZWVyeml5dHpsdXZxY2lqc2liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg2MjY1MCwiZXhwIjoyMDg0NDM4NjUwfQ.fj_AqKWmQQxI8mHw0uB0LcRjP7BqPqHPtV8HllGr2FY"

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def create_fisiolife():
    print("🏥 Criando ambiente FisioLife via Supabase REST API...\n")
    
    tenant_id = str(uuid.uuid4())
    
    try:
        # 1. CRIAR TENANT
        print("📝 Criando tenant...")
        tenant_data = {
            "id": tenant_id,
            "nome": "FisioLife - Clínica de Fisioterapia",
            "slug": "fisiolife-demo",
            "niche": "fisioterapia",
            "created_at": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/tenants",
            headers=headers,
            json=tenant_data
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Tenant criado: {tenant_id}")
        elif "duplicate" in response.text.lower():
            print(f"⚠️  Tenant já existe, continuando...")
        else:
            print(f"❌ Erro ao criar tenant: {response.status_code} - {response.text}")
            return
        
        # 2. CRIAR USUÁRIO ADMIN
        print("\n👤 Criando usuário admin...")
        user_data = {
            "id": str(uuid.uuid4()),
            "email": "dra.silva@fisiolife.com.br",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILLqh3u3m",  # demo123
            "nome": "Dra. Maria Silva",
            "role": "admin",
            "tenant_id": tenant_id,
            "created_at": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/users",
            headers=headers,
            json=user_data
        )
        
        if response.status_code in [200, 201]:
            print("✅ Usuário admin criado")
        elif "duplicate" in response.text.lower():
            print("⚠️  Usuário já existe")
        else:
            print(f"❌ Erro ao criar usuário: {response.status_code} - {response.text}")
        
        # 3. CRIAR CATEGORIAS
        print("\n💰 Criando categorias financeiras...")
        categories_data = [
            {"id": str(uuid.uuid4()), "name": "Consultas", "type": "receita", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Tratamentos", "type": "receita", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Pilates", "type": "receita", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "RPG", "type": "receita", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Aluguel", "type": "despesa", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Equipamentos", "type": "despesa", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Materiais", "type": "despesa", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Marketing", "type": "despesa", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
        ]
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/finance_categories",
            headers=headers,
            json=categories_data
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {len(categories_data)} categorias criadas")
            category_map = {cat["name"]: cat["id"] for cat in categories_data}
        else:
            print(f"⚠️  Erro ao criar categorias: {response.status_code} - {response.text}")
            return
        
        # 4. CRIAR CLIENTES (Pacientes)
        print("\n👥 Criando pacientes...")
        pacientes_data = [
            {"id": str(uuid.uuid4()), "name": "João Carlos Oliveira", "email": "joao.oliveira@email.com", "phone": "(11) 98765-4321", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Ana Paula Santos", "email": "ana.santos@email.com", "phone": "(11) 97654-3210", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Pedro Henrique Lima", "email": "pedro.lima@email.com", "phone": "(11) 96543-2109", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Mariana Costa", "email": "mariana.costa@email.com", "phone": "(11) 95432-1098", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Carlos Eduardo Souza", "email": "carlos.souza@email.com", "phone": "(11) 94321-0987", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Juliana Ferreira", "email": "juliana.ferreira@email.com", "phone": "(11) 93210-9876", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
        ]
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/customers",
            headers=headers,
            json=pacientes_data
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {len(pacientes_data)} pacientes criados")
            customer_ids = [p["id"] for p in pacientes_data]
        else:
            print(f"⚠️  Erro ao criar pacientes: {response.status_code}")
            customer_ids = []
        
        # 5. CRIAR FORNECEDORES
        print("\n🏪 Criando fornecedores...")
        fornecedores_data = [
            {"id": str(uuid.uuid4()), "name": "MedEquip Ltda", "email": "vendas@medequip.com.br", "phone": "(11) 4000-1234", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "FisioSupply", "email": "contato@fisiosupply.com.br", "phone": "(11) 4000-5678", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
            {"id": str(uuid.uuid4()), "name": "Imobiliária Prime", "email": "locacao@primeimoveis.com.br", "phone": "(11) 4000-9012", "tenant_id": tenant_id, "created_at": datetime.now().isoformat()},
        ]
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/suppliers",
            headers=headers,
            json=fornecedores_data
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {len(fornecedores_data)} fornecedores criados")
            supplier_ids = [f["id"] for f in fornecedores_data]
        else:
            print(f"⚠️  Erro ao criar fornecedores: {response.status_code}")
            supplier_ids = []
        
        # 6. CRIAR LANÇAMENTOS FINANCEIROS
        print("\n💸 Criando lançamentos financeiros...")
        
        finance_entries = []
        start_date = datetime.now() - timedelta(days=60)
        
        # RECEITAS
        servicos = [
            ("Avaliação Fisioterapêutica", 150.00, "Consultas"),
            ("Sessão de RPG", 180.00, "RPG"),
            ("Sessão de Pilates", 120.00, "Pilates"),
            ("Fisioterapia Ortopédica", 160.00, "Tratamentos"),
            ("Fisioterapia Respiratória", 140.00, "Tratamentos"),
        ]
        
        for _ in range(50):
            descricao, valor, categoria = random.choice(servicos)
            customer_id = random.choice(customer_ids) if customer_ids else None
            days_ago = random.randint(0, 60)
            entry_date = (start_date + timedelta(days=days_ago)).date().isoformat()
            status = random.choice(["pago"] * 7 + ["pendente"] * 2 + ["atrasado"])
            
            finance_entries.append({
                "id": str(uuid.uuid4()),
                "description": descricao,
                "amount": valor,
                "due_date": entry_date,
                "status": status,
                "type": "receita",
                "category_id": category_map[categoria],
                "customer_id": customer_id,
                "tenant_id": tenant_id,
                "created_at": datetime.now().isoformat()
            })
        
        # DESPESAS
        despesas = [
            ("Aluguel do Espaço", 3500.00, "Aluguel", 2),
            ("Manutenção de Equipamentos", 450.00, "Equipamentos", 0),
            ("Material de Limpeza", 280.00, "Materiais", None),
            ("Google Ads", 600.00, "Marketing", None),
        ]
        
        for _ in range(20):
            descricao, valor, categoria, supplier_idx = random.choice(despesas)
            days_ago = random.randint(0, 60)
            entry_date = (start_date + timedelta(days=days_ago)).date().isoformat()
            status = random.choice(["pago"] * 8 + ["pendente"] * 2)
            supplier_id = supplier_ids[supplier_idx] if supplier_idx is not None and supplier_ids else None
            
            finance_entries.append({
                "id": str(uuid.uuid4()),
                "description": descricao,
                "amount": valor,
                "due_date": entry_date,
                "status": status,
                "type": "despesa",
                "category_id": category_map[categoria],
                "supplier_id": supplier_id,
                "tenant_id": tenant_id,
                "created_at": datetime.now().isoformat()
            })
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/finance_entries",
            headers=headers,
            json=finance_entries
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ {len(finance_entries)} lançamentos criados")
        else:
            print(f"⚠️  Erro ao criar lançamentos: {response.status_code} - {response.text[:200]}")
        
        print("\n" + "="*60)
        print("✨ AMBIENTE FISIOLIFE CRIADO COM SUCESSO!")
        print("="*60)
        print("📧 Email: dra.silva@fisiolife.com.br")
        print("🔑 Senha: demo123")
        print("🏢 Slug: fisiolife-demo")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_fisiolife()
