"""
Script para criar ambiente demo de FisioLife
Usa psycopg2 puro para evitar problemas de pool do SQLAlchemy
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date, timedelta
import random
import uuid
import bcrypt

# Configuração do banco
DB_CONFIG = {
    "host": "aws-0-sa-east-1.pooler.supabase.com",
    "port": 5432,
    "database": "postgres",
    "user": "postgres.vmeerziytzluvqcijsib",
    "password": "CRMaster2026JP"
}

def hash_password(password):
    """Gera hash bcrypt da senha"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_fisio_demo():
    conn = None
    try:
        print("🏥 Conectando ao Supabase...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("✅ Conexão estabelecida!")
        
        # IDs
        tenant_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        print(f"\n📝 Criando tenant: FisioLife ({tenant_id})")
        
        # 1. CRIAR TENANT
        cur.execute("""
            INSERT INTO public.tenants (id, nome, slug, niche, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id
        """, (tenant_id, "FisioLife - Clínica de Fisioterapia", "fisiolife-demo", "fisioterapia", datetime.now()))
        
        tenant_id = cur.fetchone()[0]
        print(f"✅ Tenant criado: {tenant_id}")
        
        # 2. CRIAR USUÁRIO ADMIN
        print(f"\n👤 Criando usuário: Dra. Maria Silva")
        hashed_pwd = hash_password("demo123")
        
        cur.execute("""
            INSERT INTO public.users (id, email, password, nome, role, tenant_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
        """, (user_id, "dra.silva@fisiolife.com.br", hashed_pwd, "Dra. Maria Silva", "admin", tenant_id, datetime.now()))
        
        print(f"✅ Usuário admin criado")
        
        # 3. CRIAR CATEGORIAS FINANCEIRAS
        print(f"\n💰 Criando categorias financeiras...")
        categories = {
            "Consultas": ("receita", str(uuid.uuid4())),
            "Tratamentos": ("receita", str(uuid.uuid4())),
            "Pilates": ("receita", str(uuid.uuid4())),
            "RPG": ("receita", str(uuid.uuid4())),
            "Aluguel": ("despesa", str(uuid.uuid4())),
            "Equipamentos": ("despesa", str(uuid.uuid4())),
            "Materiais": ("despesa", str(uuid.uuid4())),
            "Marketing": ("despesa", str(uuid.uuid4())),
        }
        
        for cat_name, (cat_type, cat_id) in categories.items():
            cur.execute("""
                INSERT INTO public.finance_categories (id, name, type, tenant_id, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (cat_id, cat_name, cat_type, tenant_id, datetime.now()))
        
        print(f"✅ {len(categories)} categorias criadas")
        
        # 4. CRIAR CLIENTES (Pacientes)
        print(f"\n👥 Criando pacientes...")
        pacientes = [
            ("João Carlos Oliveira", "joao.oliveira@email.com", "(11) 98765-4321"),
            ("Ana Paula Santos", "ana.santos@email.com", "(11) 97654-3210"),
            ("Pedro Henrique Lima", "pedro.lima@email.com", "(11) 96543-2109"),
            ("Mariana Costa", "mariana.costa@email.com", "(11) 95432-1098"),
            ("Carlos Eduardo Souza", "carlos.souza@email.com", "(11) 94321-0987"),
            ("Juliana Ferreira", "juliana.ferreira@email.com", "(11) 93210-9876"),
            ("Roberto Alves", "roberto.alves@email.com", "(11) 92109-8765"),
            ("Fernanda Martins", "fernanda.martins@email.com", "(11) 91098-7654"),
        ]
        
        customer_ids = []
        for nome, email, telefone in pacientes:
            cust_id = str(uuid.uuid4())
            customer_ids.append(cust_id)
            cur.execute("""
                INSERT INTO public.customers (id, name, email, phone, tenant_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (cust_id, nome, email, telefone, tenant_id, datetime.now()))
        
        print(f"✅ {len(pacientes)} pacientes criados")
        
        # 5. CRIAR FORNECEDORES
        print(f"\n🏪 Criando fornecedores...")
        fornecedores = {
            "MedEquip Ltda": str(uuid.uuid4()),
            "FisioSupply": str(uuid.uuid4()),
            "Imobiliária Prime": str(uuid.uuid4()),
        }
        
        for nome_forn, forn_id in fornecedores.items():
            cur.execute("""
                INSERT INTO public.suppliers (id, name, email, phone, tenant_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (forn_id, nome_forn, f"contato@{nome_forn.lower().replace(' ', '')}.com.br", "(11) 4000-0000", tenant_id, datetime.now()))
        
        print(f"✅ {len(fornecedores)} fornecedores criados")
        
        # 6. CRIAR LANÇAMENTOS FINANCEIROS
        print(f"\n💸 Criando lançamentos financeiros (últimos 90 dias)...")
        
        start_date = date.today() - timedelta(days=90)
        finance_count = 0
        
        # RECEITAS
        servicos = [
            ("Avaliação Fisioterapêutica", 150.00, "Consultas"),
            ("Sessão de RPG", 180.00, "RPG"),
            ("Sessão de Pilates", 120.00, "Pilates"),
            ("Fisioterapia Ortopédica", 160.00, "Tratamentos"),
            ("Fisioterapia Respiratória", 140.00, "Tratamentos"),
        ]
        
        for _ in range(100):
            descricao, valor, categoria = random.choice(servicos)
            customer_id = random.choice(customer_ids)
            days_ago = random.randint(0, 90)
            entry_date = start_date + timedelta(days=days_ago)
            status = random.choice(["pago"] * 7 + ["pendente"] * 2 + ["atrasado"])
            
            cur.execute("""
                INSERT INTO public.finance_entries 
                (id, description, amount, due_date, status, type, category_id, customer_id, tenant_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), descricao, valor, entry_date, status, "receita", categories[categoria][1], customer_id, tenant_id, datetime.now()))
            finance_count += 1
        
        # DESPESAS
        despesas_list = [
            ("Aluguel do Espaço", 3500.00, "Aluguel", "Imobiliária Prime"),
            ("Manutenção de Equipamentos", 450.00, "Equipamentos", "MedEquip Ltda"),
            ("Material de Limpeza", 280.00, "Materiais", None),
            ("Google Ads", 600.00, "Marketing", None),
        ]
        
        for _ in range(30):
            descricao, valor, categoria, fornecedor = random.choice(despesas_list)
            days_ago = random.randint(0, 90)
            entry_date = start_date + timedelta(days=days_ago)
            status = random.choice(["pago"] * 8 + ["pendente"] * 2)
            supplier_id = fornecedores.get(fornecedor) if fornecedor else None
            
            cur.execute("""
                INSERT INTO public.finance_entries 
                (id, description, amount, due_date, status, type, category_id, supplier_id, tenant_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), descricao, valor, entry_date, status, "despesa", categories[categoria][1], supplier_id, tenant_id, datetime.now()))
            finance_count += 1
        
        print(f"✅ {finance_count} lançamentos criados")
        
        # 7. COMMIT
        conn.commit()
        
        print("\n" + "="*60)
        print("✨ AMBIENTE DEMO CRIADO COM SUCESSO!")
        print("="*60)
        print(f"📧 Email: dra.silva@fisiolife.com.br")
        print(f"🔑 Senha: demo123")
        print(f"🏢 Ambiente: FisioLife - Clínica de Fisioterapia")
        print(f"🔗 Slug: fisiolife-demo")
        print("="*60)
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            cur.close()
            conn.close()
            print("\n🔌 Conexão fechada")

if __name__ == "__main__":
    create_fisio_demo()
