from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import os
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from fpdf import FPDF
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import (
    Plan as SQLPlan,
    PlanItem as SQLPlanItem,
    Subscription as SQLSubscription,
    Customer as SQLCustomer,
    Tenant as SQLTenant,
    FinanceEntry as SQLFinanceEntry,
    Product as SQLProduct
)
from app.services import storage_service
from app.services.commission_service import calculate_commission_from_subscription
from decimal import Decimal

router = APIRouter(prefix="/tenant", tags=["subscriptions"])

# --- Models ---

class PlanItemSchema(BaseModel):
    product_id: str
    nome: Optional[str] = None
    quantidade: float = 1.0
    frequency: str = "monthly"
    preco_unitario: float = 0.0
    total: float = 0.0

class PlanSchema(BaseModel):
    id: Optional[str] = None
    nome: str
    descricao: Optional[str] = ""
    periodicidade: str # mensal, trimestral, semestral, anual
    valor_base: float
    itens: List[PlanItemSchema] = []
    ativo: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubscriptionItemSchema(BaseModel):
    product_id: str
    descricao: str
    quantidade: float
    preco_unitario: float
    total: float

class SubscriptionSchema(BaseModel):
    id: Optional[str] = None
    customer_id: str
    plano_id: str
    professional_id: Optional[str] = None
    data_inicio: str
    data_fim: Optional[str] = None
    status: str = "Pendente Assinatura"
    periodicidade: str
    valor_total: float
    itens: List[SubscriptionItemSchema] = []
    contrato_pdf: Optional[str] = None
    created_at: Optional[datetime] = None
    professional_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Helpers ---

def generate_contract_pdf(db: Session, tenant_id: uuid.UUID, sub_data: Dict[str, Any], plan: SQLPlan) -> str:
    tenant = db.query(SQLTenant).filter(SQLTenant.id == tenant_id).first()
    customer = db.query(SQLCustomer).filter(SQLCustomer.id == sub_data["customer_id"]).first()
    
    nome_empresa = tenant.name
    customer_name = customer.name if customer else "CLIENTE NÃO IDENTIFICADO"
    customer_doc = customer.document if customer else "---"
    customer_addr = customer.address if customer else "---"

    pdf = FPDF()
    pdf.add_page()
    
    # Header styling
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 40, 'F')
    pdf.set_fill_color(212, 175, 55)
    pdf.rect(0, 38, 210, 2, 'F')

    pdf.set_y(12)
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "CONTRATO DE ADESÃO", 0, 1, "R")
    
    pdf.ln(25)
    pdf.set_text_color(15, 23, 42)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "1. PARTES CONTRATANTES", 0, 1)
    
    # Simple Content
    pdf.set_font("Arial", "", 10)
    pdf.multi_cell(0, 5, f"CONTRATADA: {nome_empresa}\nCNPJ: {tenant.document or '---'}\n\nCONTRATANTE: {customer_name}\nDOC: {customer_doc}")
    
    pdf.ln(10)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "2. OBJETO E VALORES", 0, 1)
    pdf.set_font("Arial", "", 10)
    pdf.multi_cell(0, 5, f"Plano: {plan.name}\nValor: R$ {sub_data['valor_total']:.2f} / {sub_data['periodicidade']}\nInício: {sub_data['data_inicio']}")

    # PDF Output & Upload
    pdf_content = pdf.output(dest='S')
    filename = f"contrato_{sub_data['id']}.pdf"
    
    try:
        public_url = storage_service.upload_file(
            pdf_content, filename, tenant.slug, "contratos"
        )
        print(f"DEBUG: Contrato gerado e enviado para {public_url}")
        return public_url
    except Exception as e:
        print(f"ERROR: Falha ao gerar/enviar contrato: {e}")
        return ""

# --- Helpers ---

def map_plan_to_schema(plan: SQLPlan) -> Dict[str, Any]:
    return {
        "id": str(plan.id),
        "nome": plan.name,
        "descricao": plan.description,
        "periodicidade": plan.periodicity,
        "valor_base": float(plan.base_price),
        "ativo": plan.active,
        "created_at": plan.created_at,
        "itens": [
            {
                "product_id": str(item.product_id),
                "nome": item.product.name if item.product else "Item",
                "quantidade": float(item.quantity),
                "frequency": item.frequency,
                "preco_unitario": float(item.product.price) if item.product else 0,
                "total": float(item.product.price * item.quantity) if item.product else 0
            } for item in plan.items
        ]
    }

# --- Endpoints ---

@router.get("/plans", response_model=List[PlanSchema])
async def get_plans(current_user: TokenData = Depends(get_current_tenant_user), db: Session = Depends(get_db)):
    plans = db.query(SQLPlan).filter(SQLPlan.tenant_id == current_user.tenant_id).all()
    return [map_plan_to_schema(p) for p in plans]

@router.post("/plans", response_model=PlanSchema)
async def create_plan(plan_in: PlanSchema, current_user: TokenData = Depends(get_current_tenant_user), db: Session = Depends(get_db)):
    new_plan = SQLPlan(
        tenant_id=current_user.tenant_id,
        name=plan_in.nome,
        description=plan_in.descricao,
        base_price=plan_in.valor_base,
        periodicity=plan_in.periodicidade,
        active=plan_in.ativo
    )
    db.add(new_plan)
    db.flush()
    
    for item in plan_in.itens:
        db.add(SQLPlanItem(
            plan_id=new_plan.id,
            product_id=item.product_id,
            quantity=int(item.quantidade),
            frequency=item.frequency
        ))
    
    db.commit()
    db.refresh(new_plan)
    return map_plan_to_schema(new_plan)

@router.get("/subscriptions", response_model=List[SubscriptionSchema])
async def get_subscriptions(current_user: TokenData = Depends(get_current_tenant_user), db: Session = Depends(get_db)):
    subs = db.query(SQLSubscription).filter(SQLSubscription.tenant_id == current_user.tenant_id).all()
    # Mapping to schema
    result = []
    for s in subs:
        result.append({
            "id": str(s.id),
            "customer_id": str(s.customer_id),
            "plano_id": str(s.plan_id),
            "professional_id": str(s.professional_id) if s.professional_id else None,
            "professional_name": s.professional.name if s.professional else None,
            "data_inicio": s.start_date.isoformat(),
            "data_fim": s.next_billing_date.isoformat() if s.next_billing_date else None,
            "status": s.status,
            "periodicidade": s.periodicity,
            "valor_total": float(s.price),
            "contrato_pdf": s.contract_url,
            "created_at": s.created_at
        })
    return result

@router.post("/subscriptions")
async def create_subscription(sub_in: SubscriptionSchema, current_user: TokenData = Depends(get_current_tenant_user), db: Session = Depends(get_db)):
    plan = db.query(SQLPlan).filter(SQLPlan.id == sub_in.plano_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    sub_id = uuid.uuid4()
    start_date = datetime.fromisoformat(sub_in.data_inicio).date()
    
    # Calc end date
    months = {"mensal": 1, "trimestral": 3, "semestral": 6, "anual": 12}.get(sub_in.periodicidade.lower(), 1)
    next_billing = start_date + timedelta(days=months * 30)

    new_sub = SQLSubscription(
        id=sub_id,
        tenant_id=current_user.tenant_id,
        customer_id=sub_in.customer_id,
        plan_id=sub_in.plano_id,
        professional_id=sub_in.professional_id,
        status="Pendente Assinatura",
        start_date=start_date,
        next_billing_date=next_billing,
        price=sub_in.valor_total,
        periodicity=sub_in.periodicidade
    )
    
    # Generate Contract
    sub_dict = sub_in.dict()
    sub_dict["id"] = str(sub_id)
    pdf_url = generate_contract_pdf(db, current_user.tenant_id, sub_dict, plan)
    new_sub.contract_url = pdf_url
    
    db.add(new_sub)
    db.flush()  # Flush so sub_id is available for commission FK
    
    # Future finance entries
    num_installments = 1 # Simple default
    for i in range(num_installments):
        due = start_date + timedelta(days=i*30)
        db.add(SQLFinanceEntry(
            tenant_id=current_user.tenant_id,
            customer_id=sub_in.customer_id,
            type="receita",
            description=f"Mensalidade {plan.name} - {i+1}",
            amount=sub_in.valor_total,
            due_date=due,
            status="pendente",
            origin="assinatura"
        ))

    # Calculate commission for the professional if one was linked
    if sub_in.professional_id:
        calculate_commission_from_subscription(
            db=db,
            subscription_id=str(sub_id),
            professional_id=sub_in.professional_id,
            tenant_id=str(current_user.tenant_id),
            subscription_value=Decimal(str(sub_in.valor_total))
        )

    db.commit()
    return {"id": str(sub_id), "contract_url": pdf_url}

@router.put("/subscriptions/{sub_id}/sign")
async def sign_subscription(sub_id: str, current_user: TokenData = Depends(get_current_tenant_user), db: Session = Depends(get_db)):
    sub = db.query(SQLSubscription).filter(SQLSubscription.id == sub_id, SQLSubscription.tenant_id == current_user.tenant_id).first()
    if not sub: raise HTTPException(status_code=404)
    sub.status = "Ativa"
    db.commit()
    return {"status": "Ativa"}

@router.get("/subscriptions/{sub_id}/contract")
async def get_contract_file(
    sub_id: str, 
    token: Optional[str] = None,
    current_user: TokenData = Depends(get_current_tenant_user), 
    db: Session = Depends(get_db)
):
    # current_user is already handled by get_current_tenant_user which supports token in query
    sub = db.query(SQLSubscription).filter(SQLSubscription.id == sub_id, SQLSubscription.tenant_id == current_user.tenant_id).first()
    if not sub or not sub.contract_url:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    if sub.contract_url.startswith("http"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(sub.contract_url)
    
    if not os.path.exists(sub.contract_url):
        raise HTTPException(status_code=404, detail="Arquivo físico do contrato não encontrado")
        
    return FileResponse(sub.contract_url)
