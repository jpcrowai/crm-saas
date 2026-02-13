import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, timedelta
import random
from decimal import Decimal
import uuid

# Database connection - usando porta direta 5432 em vez do pooler
DATABASE_URL = "postgresql://postgres.vmeerziytzluvqcijsib:CRMaster2026JP@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def generate_uuid():
    return str(uuid.uuid4())

def seed_fisio_demo():
    db = SessionLocal()
    try:
        print("🏥 Criando ambiente demo: FisioLife - Clínica de Fisioterapia")
        
        # 1. CREATE TENANT
        tenant_id = generate_uuid()
        tenant_slug = "fisiolife-demo"
        
        db.execute(text("""
            INSERT INTO public.tenants (id, nome, slug, niche, created_at)
            VALUES (:id, :nome, :slug, :niche, :created_at)
            ON CONFLICT (slug) DO NOTHING
        """), {
            "id": tenant_id,
            "nome": "FisioLife - Clínica de Fisioterapia",
            "slug": tenant_slug,
            "niche": "fisioterapia",
            "created_at": datetime.now()
        })
        
        # 2. CREATE TENANT USER (fisioterapeuta principal)
        user_id = generate_uuid()
        db.execute(text("""
            INSERT INTO public.users (id, email, password, nome, role, tenant_id, created_at)
            VALUES (:id, :email, :password, :nome, :role, :tenant_id, :created_at)
            ON CONFLICT (email) DO NOTHING
        """), {
            "id": user_id,
            "email": "dra.silva@fisiolife.com.br",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILLqh3u3m",  # senha: demo123
            "nome": "Dra. Maria Silva",
            "role": "admin",
            "tenant_id": tenant_id,
            "created_at": datetime.now()
        })
        
        print(f"✅ Tenant criado: {tenant_slug} (ID: {tenant_id})")
        
        # 3. CREATE FINANCE CATEGORIES
        categories_data = [
            ("Consultas", "receita"),
            ("Tratamentos", "receita"),
            ("Pilates", "receita"),
            ("RPG", "receita"),
            ("Aluguel", "despesa"),
            ("Equipamentos", "despesa"),
            ("Materiais", "despesa"),
            ("Marketing", "despesa"),
            ("Honorários", "despesa"),
        ]
        
        category_ids = {}
        for cat_name, cat_type in categories_data:
            cat_id = generate_uuid()
            category_ids[cat_name] = cat_id
            db.execute(text("""
                INSERT INTO public.finance_categories (id, name, type, tenant_id, created_at)
                VALUES (:id, :name, :type, :tenant_id, :created_at)
            """), {
                "id": cat_id,
                "name": cat_name,
                "type": cat_type,
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
        
        print(f"✅ {len(categories_data)} categorias financeiras criadas")
        
        # 4. CREATE CUSTOMERS (Pacientes)
        pacientes = [
            {"nome": "João Carlos Oliveira", "email": "joao.oliveira@email.com", "telefone": "(11) 98765-4321"},
            {"nome": "Ana Paula Santos", "email": "ana.santos@email.com", "telefone": "(11) 97654-3210"},
            {"nome": "Pedro Henrique Lima", "email": "pedro.lima@email.com", "telefone": "(11) 96543-2109"},
            {"nome": "Mariana Costa", "email": "mariana.costa@email.com", "telefone": "(11) 95432-1098"},
            {"nome": "Carlos Eduardo Souza", "email": "carlos.souza@email.com", "telefone": "(11) 94321-0987"},
            {"nome": "Juliana Ferreira", "email": "juliana.ferreira@email.com", "telefone": "(11) 93210-9876"},
            {"nome": "Roberto Alves", "email": "roberto.alves@email.com", "telefone": "(11) 92109-8765"},
            {"nome": "Fernanda Martins", "email": "fernanda.martins@email.com", "telefone": "(11) 91098-7654"},
            {"nome": "Ricardo Pereira", "email": "ricardo.pereira@email.com", "telefone": "(11) 90987-6543"},
            {"nome": "Patricia Rodrigues", "email": "patricia.rodrigues@email.com", "telefone": "(11) 89876-5432"},
        ]
        
        customer_ids = []
        for pac in pacientes:
            cust_id = generate_uuid()
            customer_ids.append(cust_id)
            db.execute(text("""
                INSERT INTO public.customers (id, name, email, phone, tenant_id, created_at)
                VALUES (:id, :name, :email, :phone, :tenant_id, :created_at)
            """), {
                "id": cust_id,
                "name": pac["nome"],
                "email": pac["email"],
                "phone": pac["telefone"],
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
        
        print(f"✅ {len(pacientes)} pacientes (customers) criados")
        
        # 5. CREATE SUPPLIERS (Fornecedores)
        fornecedores = [
            {"nome": "MedEquip - Equipamentos Médicos", "email": "vendas@medequip.com.br", "telefone": "(11) 4000-1234"},
            {"nome": "FisioSupply - Materiais para Fisioterapia", "email": "contato@fisiosupply.com.br", "telefone": "(11) 4000-5678"},
            {"nome": "TechPilates - Equipamentos de Pilates", "email": "vendas@techpilates.com.br", "telefone": "(11) 4000-9012"},
            {"nome": "Imobiliária Prime - Aluguel Comercial", "email": "locacao@primeimoveis.com.br", "telefone": "(11) 4000-3456"},
        ]
        
        supplier_ids = {}
        for forn in fornecedores:
            supp_id = generate_uuid()
            supplier_ids[forn["nome"]] = supp_id
            db.execute(text("""
                INSERT INTO public.suppliers (id, name, email, phone, tenant_id, created_at)
                VALUES (:id, :name, :email, :phone, :tenant_id, :created_at)
            """), {
                "id": supp_id,
                "name": forn["nome"],
                "email": forn["email"],
                "phone": forn["telefone"],
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
        
        print(f"✅ {len(fornecedores)} fornecedores criados")
        
        # 6. CREATE FINANCE ENTRIES (Últimos 90 dias)
        start_date = date.today() - timedelta(days=90)
        
        # RECEITAS (Consultas e tratamentos)
        services = [
            {"descricao": "Avaliação Fisioterapêutica", "valor": 150.00, "categoria": "Consultas"},
            {"descricao": "Sessão de RPG", "valor": 180.00, "categoria": "RPG"},
            {"descricao": "Sessão de Pilates", "valor": 120.00, "categoria": "Pilates"},
            {"descricao": "Fisioterapia Ortopédica", "valor": 160.00, "categoria": "Tratamentos"},
            {"descricao": "Fisioterapia Neurológica", "valor": 200.00, "categoria": "Tratamentos"},
            {"descricao": "Fisioterapia Respiratória", "valor": 140.00, "categoria": "Tratamentos"},
        ]
        
        finance_count = 0
        
        # Gerar 150 receitas nos últimos 90 dias
        for _ in range(150):
            service = random.choice(services)
            customer_id = random.choice(customer_ids)
            days_ago = random.randint(0, 90)
            entry_date = start_date + timedelta(days=days_ago)
            
            # 70% pago, 20% pendente, 10% atrasado
            rand = random.random()
            if rand < 0.70:
                status = "pago"
            elif rand < 0.90:
                status = "pendente"
            else:
                status = "atrasado"
            
            db.execute(text("""
                INSERT INTO public.finance_entries 
                (id, description, amount, due_date, status, type, category_id, customer_id, tenant_id, created_at)
                VALUES (:id, :description, :amount, :due_date, :status, :type, :category_id, :customer_id, :tenant_id, :created_at)
            """), {
                "id": generate_uuid(),
                "description": service["descricao"],
                "amount": Decimal(str(service["valor"])),
                "due_date": entry_date,
                "status": status,
                "type": "receita",
                "category_id": category_ids[service["categoria"]],
                "customer_id": customer_id,
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
            finance_count += 1
        
        # DESPESAS
        despesas = [
            {"descricao": "Aluguel do Espaço", "valor": 3500.00, "categoria": "Aluguel", "fornecedor": "Imobiliária Prime - Aluguel Comercial", "recorrente": True},
            {"descricao": "Manutenção de Equipamentos", "valor": 450.00, "categoria": "Equipamentos", "fornecedor": "MedEquip - Equipamentos Médicos"},
            {"descricao": "Compra de Faixas e Bolas", "valor": 280.00, "categoria": "Materiais", "fornecedor": "FisioSupply - Materiais para Fisioterapia"},
            {"descricao": "Anúncios Google Ads", "valor": 600.00, "categoria": "Marketing"},
            {"descricao": "Reforma de Aparelho de Pilates", "valor": 1200.00, "categoria": "Equipamentos", "fornecedor": "TechPilates - Equipamentos de Pilates"},
            {"descricao": "Material de Limpeza", "valor": 150.00, "categoria": "Materiais"},
        ]
        
        # Gerar despesas mensais + pontuais
        for month_offset in range(3):  # últimos 3 meses
            month_start = start_date + timedelta(days=month_offset * 30)
            
            # Despesas recorrentes (aluguel)
            db.execute(text("""
                INSERT INTO public.finance_entries 
                (id, description, amount, due_date, status, type, category_id, supplier_id, tenant_id, created_at)
                VALUES (:id, :description, :amount, :due_date, :status, :type, :category_id, :supplier_id, :tenant_id, :created_at)
            """), {
                "id": generate_uuid(),
                "description": "Aluguel do Espaço",
                "amount": Decimal("3500.00"),
                "due_date": month_start + timedelta(days=5),
                "status": "pago" if month_offset < 2 else "pendente",
                "type": "despesa",
                "category_id": category_ids["Aluguel"],
                "supplier_id": supplier_ids["Imobiliária Prime - Aluguel Comercial"],
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
            finance_count += 1
        
        # Despesas pontuais
        for _ in range(20):
            despesa = random.choice(despesas)
            days_ago = random.randint(0, 90)
            entry_date = start_date + timedelta(days=days_ago)
            
            supplier_id = supplier_ids.get(despesa.get("fornecedor")) if despesa.get("fornecedor") else None
            
            db.execute(text("""
                INSERT INTO public.finance_entries 
                (id, description, amount, due_date, status, type, category_id, supplier_id, tenant_id, created_at)
                VALUES (:id, :description, :amount, :due_date, :status, :type, :category_id, :supplier_id, :tenant_id, :created_at)
            """), {
                "id": generate_uuid(),
                "description": despesa["descricao"],
                "amount": Decimal(str(despesa["valor"])),
                "due_date": entry_date,
                "status": random.choice(["pago", "pago", "pago", "pendente"]),
                "type": "despesa",
                "category_id": category_ids[despesa["categoria"]],
                "supplier_id": supplier_id,
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
            finance_count += 1
        
        print(f"✅ {finance_count} lançamentos financeiros criados")
        
        # 7. CREATE LEADS (Potenciais pacientes)
        leads_data = [
            {"nome": "Amanda Ribeiro", "email": "amanda.ribeiro@email.com", "telefone": "(11) 98888-7777", "origem": "Instagram"},
            {"nome": "Bruno Cardoso", "email": "bruno.cardoso@email.com", "telefone": "(11) 97777-6666", "origem": "Indicação"},
            {"nome": "Camila Nunes", "email": "camila.nunes@email.com", "telefone": "(11) 96666-5555", "origem": "Google"},
            {"nome": "Diego Mendes", "email": "diego.mendes@email.com", "telefone": "(11) 95555-4444", "origem": "Facebook"},
            {"nome": "Elaine Castro", "email": "elaine.castro@email.com", "telefone": "(11) 94444-3333", "origem": "Site"},
        ]
        
        stages = ["novo", "contato_inicial", "avaliacao_agendada", "convertido", "perdido"]
        
        for lead_data in leads_data:
            db.execute(text("""
                INSERT INTO public.leads (id, name, email, phone, source, stage, tenant_id, created_at)
                VALUES (:id, :name, :email, :phone, :source, :stage, :tenant_id, :created_at)
            """), {
                "id": generate_uuid(),
                "name": lead_data["nome"],
                "email": lead_data["email"],
                "phone": lead_data["telefone"],
                "source": lead_data["origem"],
                "stage": random.choice(stages),
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
        
        print(f"✅ {len(leads_data)} leads criados")
        
        # 8. CREATE APPOINTMENTS (Próximos agendamentos)
        appointment_types = [
            "Avaliação Inicial",
            "Sessão de RPG",
            "Sessão de Pilates",
            "Fisioterapia Ortopédica",
            "Retorno Pós-Tratamento"
        ]
        
        # Criar 30 agendamentos (15 passados, 15 futuros)
        appointment_count = 0
        for i in range(-15, 15):
            appointment_date = datetime.now() + timedelta(days=i)
            
            # Agendar em horários comerciais (8h-18h)
            hour = random.choice([8, 9, 10, 11, 14, 15, 16, 17])
            appointment_date = appointment_date.replace(hour=hour, minute=random.choice([0, 30]), second=0, microsecond=0)
            
            db.execute(text("""
                INSERT INTO public.appointments 
                (id, title, start_time, end_time, customer_id, tenant_id, created_at)
                VALUES (:id, :title, :start_time, :end_time, :customer_id, :tenant_id, :created_at)
            """), {
                "id": generate_uuid(),
                "title": random.choice(appointment_types),
                "start_time": appointment_date,
                "end_time": appointment_date + timedelta(minutes=50),
                "customer_id": random.choice(customer_ids),
                "tenant_id": tenant_id,
                "created_at": datetime.now()
            })
            appointment_count += 1
        
        print(f"✅ {appointment_count} agendamentos criados")
        
        db.commit()
        print("\n✨ Ambiente demo 'FisioLife' criado com sucesso!")
        print(f"📧 Login: dra.silva@fisiolife.com.br")
        print(f"🔑 Senha: demo123")
        print(f"🔗 Slug: {tenant_slug}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar ambiente demo: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_fisio_demo()
