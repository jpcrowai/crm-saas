from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import os
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from fpdf import FPDF
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.services.excel_service import read_sheet, write_sheet

router = APIRouter(prefix="/tenant", tags=["subscriptions"])

# --- Models ---

class PlanItem(BaseModel):
    product_id: str
    nome: str
    quantidade: float = 1.0
    frequency: str = "monthly" # weekly, monthly, once, unlimited
    preco_unitario: float
    total: float

class Plan(BaseModel):
    id: Optional[str] = None
    nome: str
    descricao: Optional[str] = ""
    periodicidade: str # mensal, trimestral, semestral, anual
    valor_base: float
    itens: List[PlanItem] = []
    ativo: bool = True
    created_at: Optional[str] = None

class SubscriptionItem(BaseModel):
    product_id: str
    descricao: str
    quantidade: float
    preco_unitario: float
    total: float

class Subscription(BaseModel):
    id: Optional[str] = None
    customer_id: str # Can be Lead ID or Customer ID
    plano_id: str
    data_inicio: str
    data_fim: Optional[str] = None
    status: str = "Pendente Assinatura" # Ativa, Pendente Assinatura, Suspensa, Cancelada
    periodicidade: str
    valor_total: float
    itens: List[SubscriptionItem] = []
    contrato_pdf: Optional[str] = None
    created_at: Optional[str] = None

class Contract(BaseModel):
    id: str
    assinatura_id: str
    arquivo_url: str
    status: str = "Gerado" # Gerado, Assinado
    data_geracao: str
    data_assinatura: Optional[str] = None

# --- Helpers ---

def ensure_subscription_sheets(tenant_slug: str):
    for s in ["plans", "subscriptions", "contracts"]:
        try:
            read_sheet(tenant_slug, s)
        except:
            write_sheet(tenant_slug, s, [])

def generate_contract_pdf(tenant_slug: str, sub_data: Dict[str, Any], plan_data: Dict[str, Any]) -> str:
    # Fetch environment info for logo
    ambientes = read_sheet("ambientes", "ambientes")
    env = next((a for a in ambientes if a["slug"] == tenant_slug), {})
    logo_rel_path = env.get("logo_url")
    nome_empresa = env.get("nome_empresa", tenant_slug.upper())
    
    pdf = FPDF()
    pdf.add_page()
    
    # Header Accent
    pdf.set_fill_color(212, 175, 55) # Gold
    pdf.rect(0, 0, 210, 15, 'F')
    
    pdf.ln(20)
    
    # Logo & Title
    if logo_rel_path:
        # Resolve full path. logo_url is /static/logos/filename.ext
        # static dir is at backend/static
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", logo_rel_path.strip("/"))
        if os.path.exists(logo_path):
            pdf.image(logo_path, x=10, y=20, h=25)
    
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(15, 23, 42) # Navy 900
    pdf.cell(0, 30, "CONTRATO DE PRESTAÇÃO", 0, 1, "R")
    pdf.ln(10)
    
    # Body
    pdf.set_font("Arial", "", 11)
    pdf.set_text_color(50, 50, 50)
    text = (
        f"Pelo presente instrumento particular, de um lado {nome_empresa.upper()}, "
        f"doravante denominada CONTRATADA, e de outro lado o CLIENTE identificado pela ID "
        f"{sub_data['customer_id']}, doravante denominado CONTRATANTE, celebram o presente "
        f"contrato de prestação de serviços digitais sob as condições descritas abaixo:"
    )
    pdf.multi_cell(0, 7, text)
    pdf.ln(10)
    
    # Plan Info Box
    pdf.set_fill_color(248, 250, 252) # Gray 50
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(10, pdf.get_y(), 190, 45, 'DF')
    
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_x(15)
    pdf.set_font("Arial", "B", 13)
    pdf.cell(0, 10, f"PLANO: {plan_data['nome'].upper()}", 0, 1)
    
    pdf.set_font("Arial", "", 12)
    pdf.set_x(15)
    pdf.cell(90, 10, f"Periodicidade: {sub_data['periodicidade'].capitalize()}", 0, 0)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(90, 10, f"Valor Total: R$ {sub_data['valor_total']:.2f}", 0, 1)
    
    pdf.ln(15)
    
    # Table Header
    pdf.set_fill_color(15, 23, 42) # Navy
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(120, 10, " DESCRIÇÃO DO SERVIÇO", 1, 0, 'L', True)
    pdf.cell(30, 10, " QTD", 1, 0, 'C', True)
    pdf.cell(40, 10, " TOTAL", 1, 1, 'C', True)
    
    # Table Body
    pdf.set_text_color(30, 30, 30)
    pdf.set_font("Arial", "", 10)
    for item in sub_data["itens"]:
        pdf.cell(120, 10, f" {item['descricao']}", 1, 0, 'L')
        pdf.cell(30, 10, f" {item['quantidade']}", 1, 0, 'C')
        pdf.cell(40, 10, f" R$ {item['total']:.2f}", 1, 1, 'R')
    
    pdf.ln(25)
    pdf.multi_cell(0, 7, "A validade jurídica deste documento é garantida pela assinatura eletrônica a ser coletada em plataforma autorizada.")
    
    # Signatures
    pdf.ln(30)
    pdf.line(20, pdf.get_y(), 90, pdf.get_y())
    pdf.line(120, pdf.get_y(), 190, pdf.get_y())
    pdf.set_y(pdf.get_y() + 2)
    pdf.cell(90, 10, "CONTRATADA", 0, 0, "C")
    pdf.cell(90, 10, "CONTRATANTE", 0, 1, "C")
    
    # Footer
    pdf.set_y(280)
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 285, 210, 12, 'F')
    pdf.set_text_color(200, 200, 200)
    pdf.set_font("Arial", "I", 8)
    pdf.cell(0, 25, "Gerado automaticamente pela plataforma CRMaster - CRM SaaS de Alta Performance", 0, 0, 'C')
    
    filename = f"contrato_{sub_data['id']}.pdf"
    filepath = os.path.join("storage", tenant_slug, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    pdf.output(filepath)
    return filepath

# --- Endpoints ---

@router.get("/plans", response_model=List[Plan])
async def get_plans(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    return read_sheet(current_user.tenant_slug, "plans")

@router.post("/plans", response_model=Plan)
async def create_plan(plan: Plan, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    plans = read_sheet(current_user.tenant_slug, "plans")
    new_plan = plan.dict()
    new_plan["id"] = str(uuid.uuid4())
    new_plan["created_at"] = datetime.now().isoformat()
    plans.append(new_plan)
    write_sheet(current_user.tenant_slug, "plans", plans)
    return new_plan

@router.put("/plans/{plan_id}", response_model=Plan)
async def update_plan(plan_id: str, plan_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    plans = read_sheet(current_user.tenant_slug, "plans")
    idx = next((i for i, p in enumerate(plans) if p["id"] == plan_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Update fields except ID
    if "id" in plan_in: del plan_in["id"]
    plans[idx].update(plan_in)
    
    write_sheet(current_user.tenant_slug, "plans", plans)
    return plans[idx]

@router.get("/subscriptions", response_model=List[Subscription])
async def get_subscriptions(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    return read_sheet(current_user.tenant_slug, "subscriptions")

@router.post("/subscriptions")
async def create_subscription(sub: Subscription, background_tasks: BackgroundTasks, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    subscriptions = read_sheet(current_user.tenant_slug, "subscriptions")
    plans = read_sheet(current_user.tenant_slug, "plans")
    
    plan = next((p for p in plans if p["id"] == sub.plano_id), None)
    if not plan: raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    new_sub = sub.dict()
    new_sub["id"] = str(uuid.uuid4())
    new_sub["created_at"] = datetime.now().isoformat()
    
    # Generate Contract
    pdf_path = generate_contract_pdf(current_user.tenant_slug, new_sub, plan)
    new_sub["contrato_pdf"] = pdf_path
    
    subscriptions.append(new_sub)
    write_sheet(current_user.tenant_slug, "subscriptions", subscriptions)
    
    # Log Contract
    contracts = read_sheet(current_user.tenant_slug, "contracts")
    contracts.append({
        "id": str(uuid.uuid4()),
        "assinatura_id": new_sub["id"],
        "arquivo_url": pdf_path,
        "status": "Gerado",
        "data_geracao": datetime.now().isoformat()
    })
    write_sheet(current_user.tenant_slug, "contracts", contracts)
    
    return new_sub

@router.put("/subscriptions/{sub_id}/sign")
async def sign_subscription(sub_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    subs = read_sheet(current_user.tenant_slug, "subscriptions")
    idx = next((i for i, s in enumerate(subs) if s["id"] == sub_id), -1)
    if idx == -1: raise HTTPException(status_code=404)
    
    subs[idx]["status"] = "Ativa"
    write_sheet(current_user.tenant_slug, "subscriptions", subs)
    
    # Update Contract
    contracts = read_sheet(current_user.tenant_slug, "contracts")
    c_idx = next((i for i, c in enumerate(contracts) if c["assinatura_id"] == sub_id), -1)
    if c_idx != -1:
        contracts[c_idx]["status"] = "Assinado"
        contracts[c_idx]["data_assinatura"] = datetime.now().isoformat()
        write_sheet(current_user.tenant_slug, "contracts", contracts)
        
    # Trigger recurring finance entry for month 1
    # In a real app, this would be a CRON job, but here we can do a push
    await trigger_subscription_finance(current_user.tenant_slug, subs[idx])
    
    return subs[idx]

async def trigger_subscription_finance(tenant_slug: str, sub: Dict[str, Any]):
    # Logic to create entry in finances sheet
    from app.routers.finances import ensure_finance_sheets as ensure_f
    ensure_f(tenant_slug)
    finances = read_sheet(tenant_slug, "finances")
    
    new_finance = {
        "id": str(uuid.uuid4()),
        "data_vencimento": datetime.now().strftime("%Y-%m-%d"),
        "descricao": f"Assinatura: {sub['id']} - Mês 1",
        "tipo": "receita",
        "valor": sub["valor_total"],
        "status": "pendente",
        "origem": "venda",
        "lead_id": sub["customer_id"],
        "categoria": "Assinaturas",
        "created_at": datetime.now().isoformat()
    }
    finances.append(new_finance)
    write_sheet(tenant_slug, "finances", finances)

@router.get("/subscriptions/{sub_id}/contract")
async def get_contract_file(sub_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    subs = read_sheet(current_user.tenant_slug, "subscriptions")
    sub = next((s for s in subs if s["id"] == sub_id), None)
    if not sub or not sub.get("contrato_pdf"):
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    return FileResponse(sub["contrato_pdf"], filename=f"contrato_{sub_id}.pdf")
