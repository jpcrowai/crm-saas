from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile
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
from app.services import storage_service

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
    
    # Try to get customer data
    try:
        customers = read_sheet(tenant_slug, "customers")
        customer = next((c for c in customers if c["id"] == sub_data["customer_id"]), {})
        customer_name = customer.get("name") or customer.get("nome") or "CLIENTE NÃO IDENTIFICADO"
        customer_doc = customer.get("document") or customer.get("cpf_cnpj") or "CPF/CNPJ não informado"
        customer_addr = customer.get("address") or customer.get("endereco") or "Endereço não informado"
    except:
        customer_name = "CLIENTE NÃO IDENTIFICADO"
        customer_doc = "---"
        customer_addr = "---"

    pdf = FPDF()
    pdf.add_page()
    
    # --- DECORATIVE WAVES (Simulated with curves/polygons) ---
    # Top Wave (Blue & Gold)
    pdf.set_fill_color(15, 23, 42) # Navy 900
    pdf.rect(0, 0, 210, 40, 'F')
    
    pdf.set_fill_color(212, 175, 55) # Gold
    # A simple gold accent line
    pdf.rect(0, 38, 210, 2, 'F')

    # --- HEADER ---
    pdf.set_y(10)
    
    # CRM Master Icon in top-left
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    crm_icon_path = os.path.join(base_dir, "backend", "static", "crm_icon.png")
    if os.path.exists(crm_icon_path):
        pdf.image(crm_icon_path, 10, 7, 15)
    
    # Tenant logo if exists (shifted slightly right)
    if logo_rel_path:
        # Rel path from static/logos/filename.png to absolute
        # logo_rel_path usually starts with /static/
        t_logo_path = os.path.join(base_dir, "backend", logo_rel_path.strip("/"))
        if os.path.exists(t_logo_path):
            # Scale down and place top-right or after icon
            pdf.image(t_logo_path, 28, 7, 12) 
    
    pdf.set_y(12)
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "CONTRATO DE ADESÃO", 0, 1, "R")
    
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(0, 5, f"Termo nº {sub_data['id'].split('-')[0].upper()} | Gerado em {datetime.now().strftime('%d/%m/%Y')}", 0, 1, "R")
    
    pdf.ln(25)
    
    # --- PARTIES ---
    pdf.set_text_color(15, 23, 42)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "1. PARTES CONTRATANTES", 0, 1)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    
    # CONTRATADA BOX
    y_start = pdf.get_y()
    pdf.rect(10, y_start, 90, 35, 'DF')
    pdf.set_xy(12, y_start + 2)
    pdf.set_font("Arial", "B", 9)
    pdf.cell(86, 5, "CONTRATADA (EMPRESA)", 0, 1)
    pdf.set_font("Arial", "", 9)
    pdf.set_x(12)
    pdf.multi_cell(86, 4, f"{nome_empresa}\nCNPJ: {env.get('cnpj', 'Não informado')}\n{env.get('address', 'Endereço Principal do Sistema')}")
    
    # CONTRATANTE BOX
    pdf.set_xy(110, y_start)
    pdf.rect(110, y_start, 90, 35, 'DF')
    pdf.set_xy(112, y_start + 2)
    pdf.set_font("Arial", "B", 9)
    pdf.cell(86, 5, "CONTRATANTE (CLIENTE)", 0, 1)
    pdf.set_font("Arial", "", 9)
    pdf.set_x(112)
    pdf.multi_cell(86, 4, f"{customer_name}\nCPF/CNPJ: {customer_doc}\n{customer_addr}")
    
    pdf.ln(35) # Space after boxes
    
    # --- PLAN DETAILS ---
    pdf.ln(5)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "2. OBJETO DO CONTRATO", 0, 1)
    
    pdf.set_font("Arial", "", 10)
    pdf.multi_cell(0, 5, "Este contrato tem como objeto a prestação de serviços ou fornecimento de produtos descritos no plano abaixo selecionado, conforme condições comerciais acordadas.")
    pdf.ln(5)

    # Plan Summary
    pdf.set_fill_color(240, 253, 250) # Light teal bg
    pdf.rect(10, pdf.get_y(), 190, 20, 'F')
    pdf.set_x(15)
    pdf.set_y(pdf.get_y() + 5)
    
    pdf.set_font("Arial", "B", 11)
    pdf.cell(95, 6, f"PLANO: {plan_data['nome']}", 0, 0)
    pdf.cell(95, 6, f"VALOR: R$ {sub_data['valor_total']:.2f} / {sub_data['periodicidade']}", 0, 1, "R")
    
    pdf.set_font("Arial", "", 10)
    pdf.set_x(15)
    pdf.cell(95, 6, f"Vigência: Indeterminada", 0, 0)
    pdf.cell(95, 6, f"Início: {datetime.strptime(sub_data['data_inicio'], '%Y-%m-%d').strftime('%d/%m/%Y')}", 0, 1, "R")
    
    pdf.ln(10)
    
    # Items Table
    pdf.set_font("Arial", "B", 10)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(110, 8, " Item / Serviço", 1, 0, 'L', True)
    pdf.cell(30, 8, " Qtd.", 1, 0, 'C', True)
    pdf.cell(50, 8, " Total Parcial", 1, 1, 'R', True)
    
    pdf.set_font("Arial", "", 9)
    for item in sub_data["itens"]:
        pdf.cell(110, 8, f" {item['descricao']}", 1, 0, 'L')
        pdf.cell(30, 8, f" {item['quantidade']}", 1, 0, 'C')
        pdf.cell(50, 8, f" R$ {item['total']:.2f}", 1, 1, 'R')
        
    pdf.ln(10)
    
    # --- TERMS ---
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "3. TERMOS E CONDIÇÕES", 0, 1)
    pdf.set_font("Arial", "", 9)
    terms = (
        "1. O pagamento deverá ser efetuado conforme periodicidade escolhida.\n"
        "2. A inadimplência superior a 10 dias poderá acarretar suspensão dos serviços.\n"
        "3. O contrato poderá ser rescindido por ambas as partes com aviso prévio de 30 dias.\n"
        "4. As partes elegem o foro da comarca da CONTRATADA para dirimir quaisquer dúvidas."
    )
    pdf.multi_cell(0, 5, terms)
    
    pdf.ln(20)
    
    # --- SIGNATURES ---
    y_sig = pdf.get_y()
    if y_sig > 240: # Check if new page needed
        pdf.add_page()
        y_sig = 40
        
    pdf.line(20, y_sig, 90, y_sig)
    pdf.line(120, y_sig, 190, y_sig)
    
    pdf.set_xy(20, y_sig + 2)
    pdf.set_font("Arial", "B", 8)
    pdf.cell(70, 4, nome_empresa.upper(), 0, 1, 'C')
    pdf.set_x(20)
    pdf.set_font("Arial", "", 7)
    pdf.cell(70, 4, "Representante Legal", 0, 0, 'C')
    
    pdf.set_xy(120, y_sig + 2)
    pdf.set_font("Arial", "B", 8)
    pdf.cell(70, 4, customer_name.upper(), 0, 1, 'C')
    pdf.set_x(120)
    pdf.set_font("Arial", "", 7)
    pdf.cell(70, 4, "Cliente / Responsável", 0, 0, 'C')
    
    # --- BOTTOM WAVE ---
    pdf.set_y(-25)
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 275, 210, 25, 'F')
    
    pdf.set_y(-15)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "Documento gerado eletronicamente via CRMaster", 0, 0, 'C')
    
    # Upload PDF to Supabase Storage
    pdf_content = pdf.output(dest='S')  # Already returns bytes in fpdf2
    filename = f"contrato_{sub_data['id']}.pdf"
    
    try:
        public_url = storage_service.upload_file(
            pdf_content,
            filename,
            tenant_slug,
            "contratos"
        )
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        # Fallback to local
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
    
    # Calculate subscription end date based on periodicity and data_fim (if provided)
    start_date = datetime.fromisoformat(sub.data_inicio)
    if not sub.data_fim:
        # Auto-calculate based on periodicity
        periodicity_map = {
            "mensal": 1,
            "trimestral": 3,
            "semestral": 6,
            "anual": 12
        }
        months = periodicity_map.get(sub.periodicidade.lower(), 1)
        end_date = start_date + timedelta(days=months * 30)  # Approximation
        new_sub["data_fim"] = end_date.isoformat()
    
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
    
    # ===== GENERATE FUTURE FINANCE ENTRIES =====
    from app.routers.finances import ensure_finance_sheets
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    # Calculate number of installments based on periodicity
    periodicity_map = {
        "mensal": 1,
        "trimestral": 3,
        "semestral": 6,
        "anual": 12
    }
    interval_months = periodicity_map.get(sub.periodicidade.lower(), 1)
    
    # Calculate total duration in months
    end_date = datetime.fromisoformat(new_sub["data_fim"])
    total_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    num_installments = max(1, total_months // interval_months)
    
    # Generate finance entries for each installment
    for i in range(num_installments):
        due_date = start_date + timedelta(days=interval_months * 30 * i)
        
        finance_entry = {
            "id": str(uuid.uuid4()),
            "tipo": "receita",
            "descricao": f"Mensalidade {plan['nome']} - Parcela {i+1}/{num_installments}",
            "valor": sub.valor_total,
            "data": due_date.date().isoformat(),
            "status": "pendente",
            "categoria": "Assinatura",
            "customer_id": sub.customer_id,
            "subscription_id": new_sub["id"],  # Link to subscription
            "created_at": datetime.now().isoformat()
        }
        finances.append(finance_entry)
    
    write_sheet(current_user.tenant_slug, "finances", finances)
    
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

@router.put("/subscriptions/{sub_id}")
async def update_subscription_status(sub_id: str, data: Dict[str, str], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    subs = read_sheet(current_user.tenant_slug, "subscriptions")
    idx = next((i for i, s in enumerate(subs) if s["id"] == sub_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    
    status = data.get("status")
    if status:
        subs[idx]["status"] = status
        
    write_sheet(current_user.tenant_slug, "subscriptions", subs)
    return subs[idx]

@router.post("/subscriptions/{sub_id}/upload_signed_contract")
async def upload_signed_contract(sub_id: str, file: UploadFile = File(...), current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_subscription_sheets(current_user.tenant_slug)
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos.")
        
    subs = read_sheet(current_user.tenant_slug, "subscriptions")
    idx = next((i for i, s in enumerate(subs) if s["id"] == sub_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
        
    # Save file to Supabase Storage
    filename = f"signed_{sub_id}_{uuid.uuid4().hex[:6]}.pdf"
    
    try:
        filepath = storage_service.upload_file(
            file.file,
            filename,
            current_user.tenant_slug,
            "contratos_assinados"
        )
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        # Fallback to local
        storage_dir = os.path.join("storage", current_user.tenant_slug, "contracts_signed")
        os.makedirs(storage_dir, exist_ok=True)
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as buffer:
            from shutil import copyfileobj
            copyfileobj(file.file, buffer)
        
    # Update Subscription
    subs[idx]["contrato_assinado_url"] = filepath
    subs[idx]["status"] = "Ativa" # Auto-activate on signed contract
    
    # Update Contract Record if exists
    contracts = read_sheet(current_user.tenant_slug, "contracts")
    c_idx = next((i for i, c in enumerate(contracts) if c["assinatura_id"] == sub_id), -1)
    if c_idx != -1:
        contracts[c_idx]["status"] = "Assinado"
        contracts[c_idx]["data_assinatura"] = datetime.now().isoformat()
        contracts[c_idx]["arquivo_assinado_url"] = filepath
        write_sheet(current_user.tenant_slug, "contracts", contracts)
    
    write_sheet(current_user.tenant_slug, "subscriptions", subs)
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
