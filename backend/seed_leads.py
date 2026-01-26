import requests
import random
import time
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
TENANT = "barb-alpha"

# Data pools for realistic generation
NAMES = [
    "Lucas Silva", "Gabriel Santos", "Pedro Oliveira", "Matheus Costa", 
    "Rafael Lima", "Daniel Souza", "Bruno Alves", "Felipe Martins", 
    "Thiago Rocha", "Gustavo Pereira", "Eduardo Duarte", "Vinicius Freitas",
    "Ricardo Braga", "Henrique Ramos", "João Paulo", "Marcelo Nunes"
]
BARBEIROS = ["Carlos (Mestre)", "Zé Barba", "Marquinhos", "Léo Cortes"]
SERVICOS = ["Corte Degradê", "Barba Completa", "Corte + Barba", "Pigmentação", "Sobrancelha", "Hidratação"]
STATUS_LEAD = ["novo", "em_contato", "agendado", "convertido", "perdido"]
SENTIMENTOS = ["positivo", "neutro", "negativo", "entusiasmado"]
INTENCOES = ["agendar", "tirar_duvida", "reclamar", "elogiar", "saber_preco"]
FORMAS_PAGAMENTO = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"]
FOLLOWUP_TIPOS = ["lembrete_agendamento", "pesquisa_satisfacao", "promocao", "aniversario"]
FOLLOWUP_STATUS = ["pendente", "enviado", "respondido", "ignorado"]

def random_phone():
    return f"5511{random.randint(900000000, 999999999)}"

def random_date_past(days=90):
    return (datetime.now() - timedelta(days=random.randint(1, days))).isoformat()

def random_date_future(days=30):
    return (datetime.now() + timedelta(days=random.randint(1, days))).strftime("%Y-%m-%d")

def random_time():
    hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18])
    return f"{hour:02d}:{random.choice(['00', '30'])}"

def get_random_lead():
    name = random.choice(NAMES)
    is_vip = random.random() < 0.15
    total_visits = random.randint(0, 25) if not is_vip else random.randint(10, 50)
    valor_total = random.randint(50, 300) * total_visits if total_visits > 0 else 0
    
    return {
        # Identification
        "user_identifier": str(uuid.uuid4())[:12],
        "nome": name,
        "whatsapp": random_phone(),
        
        # Conversation
        "inicio_atendimento": random_date_past(30),
        "resumo_conversa": random.choice([
            "Cliente quer agendar corte degradê.",
            "Perguntou sobre horário amanhã.",
            "Reagendou após falta.",
            "Elogiou o atendimento do Carlos.",
            "Quer saber preço da barba."
        ]),
        "timestamp_ultima_msg": random_date_past(7),
        
        # Follow-ups
        "follow_up_1": random.choice(["Enviado", "Pendente", ""]),
        "follow_up_2": random.choice(["Enviado", "Pendente", ""]),
        "follow_up_3": random.choice(["", ""]),
        
        # Chatwoot Integration
        "id_conta_chatwoot": str(random.randint(1000, 9999)),
        "id_conversa_chatwoot": str(random.randint(10000, 99999)),
        "id_lead_chatwoot": str(random.randint(100, 999)),
        "inbox_id_chatwoot": str(random.randint(1, 5)),
        
        # Lead Scoring
        "lead_score": random.randint(10, 100),
        "prioridade_atendimento": random.choice(["alta", "media", "baixa"]),
        "cliente_vip": "Sim" if is_vip else "Não",
        
        # Financial
        "forma_pagamento_preferida": random.choice(FORMAS_PAGAMENTO),
        "valor_ultimo_servico": random.randint(30, 120),
        "valor_total_gasto": valor_total,
        "ticket_medio": round(valor_total / total_visits, 2) if total_visits > 0 else 0,
        
        # Scheduling
        "status_lead": random.choice(STATUS_LEAD),
        "data_proximo_agendamento": random_date_future(14) if random.random() > 0.4 else "",
        "horario_proximo_agendamento": random_time() if random.random() > 0.4 else "",
        "barbeiro_agendado": random.choice(BARBEIROS) if random.random() > 0.3 else "",
        "confirmacao_agendamento": random.choice(["Confirmado", "Pendente", "Cancelado", ""]),
        "faltou_ultima_vez": random.choice(["Sim", "Não"]),
        
        # Preferences
        "barbeiro_preferido": random.choice(BARBEIROS),
        "ultimo_barbeiro": random.choice(BARBEIROS),
        "barbeiros_atendidos": ", ".join(random.sample(BARBEIROS, k=random.randint(1, 3))),
        "servico_preferido": random.choice(SERVICOS),
        "ultimo_servico": random.choice(SERVICOS),
        "frequencia_media_dias": random.randint(15, 45),
        "total_visitas": total_visits,
        
        # AI Analysis
        "intencao_detectada": random.choice(INTENCOES),
        "sentimento_conversa": random.choice(SENTIMENTOS),
        "nivel_confianca_ia": round(random.uniform(0.6, 0.99), 2),
        "status_atendimento_ia": random.choice(["em_andamento", "concluido", "escalado"]),
        "atendido_por_ia": random.choice(["Sim", "Não"]),
        "handoff_humano": random.choice(["Sim", "Não"]),
        "motivo_handoff": random.choice(["Pedido complexo", "Reclamação", "VIP", ""]),
        
        # Follow-up Tracking
        "tipo_followup": random.choice(FOLLOWUP_TIPOS),
        "followup_status": random.choice(FOLLOWUP_STATUS),
        "ultimo_followup_enviado_em": random_date_past(14),
        "proximo_followup_em": random_date_future(7),
        
        # Timestamps
        "created_at": random_date_past(90),
        "updated_at": random_date_past(3)
    }

def run():
    print(f"--- Seeding Leads for {TENANT} (Barbershop Schema) ---")
    
    # 1. Login Master
    print("Logging in as Master...")
    try:
        r = requests.post(f"{BASE_URL}/auth/login-master", json={
            "email": "master@seucrm.com",
            "password": "Teste@123"
        })
        if r.status_code != 200:
            print(f"Login Failed: {r.text}")
            return
        token = r.json()["access_token"]
    except Exception as e:
        print(f"Error connecting: {e}")
        return

    # 2. Select Tenant
    print(f"Selecting Tenant: {TENANT}...")
    r = requests.post(f"{BASE_URL}/auth/select-tenant", json={
        "tenant_slug": TENANT
    }, headers={"Authorization": f"Bearer {token}"})
    
    if r.status_code != 200:
        print(f"Failed to enter tenant: {r.text}")
        return
        
    tenant_token = r.json()["access_token"]
    
    # 3. Create Leads
    num_leads = 20
    print(f"Creating {num_leads} barbershop leads...")
    for i in range(num_leads):
        lead = get_random_lead()
        r = requests.post(f"{BASE_URL}/tenant/leads", json=lead, headers={
            "Authorization": f"Bearer {tenant_token}"
        })
        if r.status_code == 200:
            print(f"[{i+1}/{num_leads}] Created: {lead['nome']} | Score: {lead['lead_score']} | VIP: {lead['cliente_vip']}")
        else:
            print(f"[{i+1}/{num_leads}] Failed: {r.text}")
        time.sleep(0.1)

    print("\nDone! Refresh your frontend to see the barbershop data.")

if __name__ == "__main__":
    run()
