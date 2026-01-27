from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import json
import os
from datetime import datetime, date
from pydantic import BaseModel
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.services.excel_service import read_sheet, write_sheet

router = APIRouter(prefix="/tenant", tags=["finances"])

# --- Models ---

class FinanceEntry(BaseModel):
    id: Optional[str] = None
    data_vencimento: str  # YYYY-MM-DD
    data_pagamento: Optional[str] = None
    data_competencia: Optional[str] = None
    descricao: str
    tipo: str  # receita / despesa
    valor: float
    status: str  # pendente / pago / atrasado
    origem: str  # venda / avulso
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    categoria: Optional[str] = None
    forma_pagamento: Optional[str] = None
    parcela: int = 1
    total_parcelas: int = 1
    observacoes: Optional[str] = None
    created_at: Optional[str] = None

class FinanceCreate(BaseModel):
    data_vencimento: str
    data_pagamento: Optional[str] = None
    data_competencia: Optional[str] = None
    descricao: str
    tipo: str
    valor: float
    status: str = "pendente"
    origem: str = "avulso"
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    categoria: Optional[str] = None
    forma_pagamento: Optional[str] = None
    parcelas: int = 1
    observacoes: Optional[str] = None

class FinanceCategory(BaseModel):
    id: str
    nome: str
    tipo: str  # entrada / saida / ambos

class PaymentMethod(BaseModel):
    id: str
    nome: str
    ativo: bool = True

# --- Helpers ---

def ensure_finance_sheets(tenant_slug: str):
    sheets = ["finances", "categories", "payment_methods"]
    for s in sheets:
        try:
            read_sheet(tenant_slug, s)
        except:
            write_sheet(tenant_slug, s, [])
            # Seed defaults for categories and methods if newly created
            if s == "categories":
                defaults = [
                    {"id": "1", "nome": "Vendas", "tipo": "entrada"},
                    {"id": "2", "nome": "Serviços", "tipo": "entrada"},
                    {"id": "3", "nome": "Aluguel", "tipo": "saida"},
                    {"id": "4", "nome": "Marketing", "tipo": "saida"},
                    {"id": "5", "nome": "Salários", "tipo": "saida"}
                ]
                write_sheet(tenant_slug, s, defaults)
            if s == "payment_methods":
                defaults = [
                    {"id": "1", "nome": "PIX", "ativo": True},
                    {"id": "2", "nome": "Dinheiro", "ativo": True},
                    {"id": "3", "nome": "Cartão de Crédito", "ativo": True},
                    {"id": "4", "nome": "Cartão de Débito", "ativo": True},
                    {"id": "5", "nome": "Boleto", "ativo": True}
                ]
                write_sheet(tenant_slug, s, defaults)

def update_overdue_statuses(finances: List[Dict[str, Any]]) -> bool:
    """Updates 'pendente' entries to 'atrasado' if date has passed. Returns True if any changed."""
    changed = False
    today = date.today().isoformat()
    for f in finances:
        if f.get("status") == "pendente" and f.get("data_vencimento") < today:
            f["status"] = "atrasado"
            changed = True
    return changed

# --- Endpoints ---

@router.get("/finances")
async def get_finances(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    if update_overdue_statuses(finances):
        write_sheet(current_user.tenant_slug, "finances", finances)
        
    return finances

@router.post("/finances")
async def create_finance(entry: FinanceCreate, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    results = []
    # Handle multiple installments if parcelas > 1
    for i in range(entry.parcelas):
        # Calculate installment date (approximate monthly)
        venc_date = datetime.strptime(entry.data_vencimento, "%Y-%m-%d")
        if i > 0:
            # Add i months
            month = (venc_date.month + i - 1) % 12 + 1
            year = venc_date.year + (venc_date.month + i - 1) // 12
            venc_date = venc_date.replace(year=year, month=month)
            
        new_entry = {
            "id": str(uuid.uuid4()),
            "data_vencimento": venc_date.strftime("%Y-%m-%d"),
            "data_pagamento": entry.data_pagamento if i == 0 else None,
            "data_competencia": entry.data_competencia or entry.data_vencimento,
            "descricao": f"{entry.descricao} ({i+1}/{entry.parcelas})" if entry.parcelas > 1 else entry.descricao,
            "tipo": entry.tipo,
            "valor": round(entry.valor / entry.parcelas, 2),
            "status": entry.status if i == 0 else "pendente",
            "origem": entry.origem,
            "lead_id": entry.lead_id,
            "customer_id": entry.customer_id,
            "categoria": entry.categoria,
            "forma_pagamento": entry.forma_pagamento,
            "parcela": i + 1,
            "total_parcelas": entry.parcelas,
            "observacoes": entry.observacoes,
            "created_at": datetime.now().isoformat()
        }
        finances.append(new_entry)
        results.append(new_entry)
        
    write_sheet(current_user.tenant_slug, "finances", finances)
    return results[0]  # Return first or list

@router.put("/finances/{finance_id}")
async def update_finance_status(finance_id: str, payload: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    idx = next((i for i, f in enumerate(finances) if f.get("id") == finance_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Não encontrado")
        
    # Allowed updates: status, data_pagamento, forma_pagamento
    finances[idx].update(payload)
    write_sheet(current_user.tenant_slug, "finances", finances)
    return finances[idx]

@router.delete("/finances/{finance_id}")
async def delete_finance(finance_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    try:
        ensure_finance_sheets(current_user.tenant_slug)
        finances = read_sheet(current_user.tenant_slug, "finances")
        # Ensure we are comparing strings as IDs usually are
        idx = next((i for i, f in enumerate(finances) if str(f.get("id")) == str(finance_id)), -1)
        
        if idx == -1:
            raise HTTPException(status_code=404, detail=f"Lançamento {finance_id} não encontrado")
        
        finances.pop(idx)
        write_sheet(current_user.tenant_slug, "finances", finances)
        return {"message": "Deletado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Categories & Methods CRUD ---

@router.get("/categories")
async def get_categories(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    return read_sheet(current_user.tenant_slug, "categories")

@router.post("/categories")
async def create_category(cat: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    categories = read_sheet(current_user.tenant_slug, "categories")
    cat["id"] = str(uuid.uuid4())
    categories.append(cat)
    write_sheet(current_user.tenant_slug, "categories", categories)
    return cat

@router.put("/categories/{cat_id}")
async def update_category(cat_id: str, cat_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    categories = read_sheet(current_user.tenant_slug, "categories")
    idx = next((i for i, c in enumerate(categories) if str(c.get("id")) == str(cat_id)), -1)
    if idx == -1: raise HTTPException(status_code=404)
    categories[idx].update(cat_in)
    write_sheet(current_user.tenant_slug, "categories", categories)
    return categories[idx]

@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    categories = read_sheet(current_user.tenant_slug, "categories")
    idx = next((i for i, c in enumerate(categories) if str(c.get("id")) == str(cat_id)), -1)
    if idx == -1: raise HTTPException(status_code=404)
    categories.pop(idx)
    write_sheet(current_user.tenant_slug, "categories", categories)
    return {"message": "Deletado"}

@router.get("/payment-methods")
async def get_payment_methods(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    return read_sheet(current_user.tenant_slug, "payment_methods")

@router.post("/payment-methods")
async def create_method(method: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    methods = read_sheet(current_user.tenant_slug, "payment_methods")
    method["id"] = str(uuid.uuid4())
    methods.append(method)
    write_sheet(current_user.tenant_slug, "payment_methods", methods)
    return method

@router.put("/payment-methods/{method_id}")
async def update_method(method_id: str, method_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    methods = read_sheet(current_user.tenant_slug, "payment_methods")
    idx = next((i for i, m in enumerate(methods) if str(m.get("id")) == str(method_id)), -1)
    if idx == -1: raise HTTPException(status_code=404)
    methods[idx].update(method_in)
    write_sheet(current_user.tenant_slug, "payment_methods", methods)
    return methods[idx]

@router.delete("/payment-methods/{method_id}")
async def delete_method(method_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    methods = read_sheet(current_user.tenant_slug, "payment_methods")
    idx = next((i for i, m in enumerate(methods) if str(m.get("id")) == str(method_id)), -1)
    if idx == -1: raise HTTPException(status_code=404)
    methods.pop(idx)
    write_sheet(current_user.tenant_slug, "payment_methods", methods)
    return {"message": "Deletado"}

# --- Specialized Reports ---

@router.get("/reports/cashflow")
async def get_cashflow_report(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    # Simple monthly aggregation for the last 6 months
    today = date.today()
    report_data = []
    
    for i in range(5, -1, -1):
        # Calculate month and year
        m = (today.month - i - 1) % 12 + 1
        y = today.year + (today.month - i - 1) // 12
        month_str = f"{y}-{m:02d}"
        
        receitas = sum(f.get("valor", 0) for f in finances if f.get("tipo") == "receita" and f.get("status") == "pago" and f.get("data_vencimento").startswith(month_str))
        despesas = sum(f.get("valor", 0) for f in finances if f.get("tipo") == "despesa" and f.get("status") == "pago" and f.get("data_vencimento").startswith(month_str))
        
        report_data.append({
            "name": month_str,
            "receitas": receitas,
            "despesas": despesas,
            "saldo": round(receitas - despesas, 2)
        })
        
    return report_data

@router.get("/reports/ranking-customers")
async def get_customer_ranking(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    # Aggregate total paid per customer_id
    ranking = {}
    for f in finances:
        cid = f.get("customer_id")
        if cid and f.get("status") == "pago" and f.get("tipo") == "receita":
            ranking[cid] = ranking.get(cid, 0) + f.get("valor", 0)
            
    # Sort and return
    import operator
    sorted_ranking = sorted(ranking.items(), key=operator.itemgetter(1), reverse=True)
    
    # We would ideally join with customer names here, but for now just returning IDs and totals
    return [{"customer_id": k, "total": round(v, 2)} for k, v in sorted_ranking[:10]]
@router.get("/export")
async def export_finances(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_finance_sheets(current_user.tenant_slug)
    finances = read_sheet(current_user.tenant_slug, "finances")
    
    import pandas as pd
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    
    df = pd.DataFrame(finances)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Financeiro')
    
    output.seek(0)
    filename = f"financeiro_{current_user.tenant_slug}_{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
