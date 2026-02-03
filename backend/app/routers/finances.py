from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import uuid
import pandas as pd
from io import BytesIO
from datetime import datetime, date
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import FinanceEntry as SQLFinanceEntry, FinanceCategory as SQLFinanceCategory

router = APIRouter(prefix="/tenant", tags=["finances"])

# --- Models ---

class FinanceEntry(BaseModel):
    id: Optional[str] = None
    data_vencimento: str  # YYYY-MM-DD (due_date)
    data_pagamento: Optional[str] = None
    data_competencia: Optional[str] = None
    descricao: str  # description
    tipo: str  # receita / despesa (type: "receita" -> revenue, "despesa" -> expense)
    valor: float  # amount
    status: str  # pendente / pago / atrasado
    origem: str  # venda / avulso (origin)
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    categoria: Optional[str] = None  # category_id
    forma_pagamento: Optional[str] = None  # payment_method
    parcela: int = 1  # installment_number
    total_parcelas: int = 1  # total_installments
    observacoes: Optional[str] = None  # observations
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


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
    nome: str  # name
    tipo: str  # entrada / saida / ambos (type)

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("/finances")
async def get_finances(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    entries = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.tenant_id == current_user.tenant_id
    ).order_by(SQLFinanceEntry.due_date.desc()).all()
    
    # Auto-update overdue statuses
    today = date.today()
    for entry in entries:
        if entry.status == "pendente" and entry.due_date < today:
            entry.status = "atrasado"
    db.commit()
    
    result = []
    for entry in entries:
        result.append({
            "id": str(entry.id),
            "data_vencimento": entry.due_date.isoformat(),
            "data_pagamento": None,  # Not stored in DB yet
            "data_competencia": entry.due_date.isoformat(),
            "descricao": entry.description,
            "tipo": entry.type,
            "valor": float(entry.amount),
            "status": entry.status,
            "origem": entry.origin,
            "lead_id": str(entry.lead_id) if entry.lead_id else None,
            "customer_id": None,
            "categoria": str(entry.category_id) if entry.category_id else None,
            "forma_pagamento": entry.payment_method,
            "parcela": entry.installment_number,
            "total_parcelas": entry.total_installments,
            "observacoes": entry.observations,
            "created_at": entry.created_at.isoformat() if entry.created_at else None
        })
    
    return result


@router.post("/finances")
async def create_finance(
    entry: FinanceCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    results = []
    
    # Handle multiple installments if parcelas > 1
    for i in range(entry.parcelas):
        # Calculate installment date (approximate monthly)
        venc_date = datetime.strptime(entry.data_vencimento, "%Y-%m-%d").date()
        if i > 0:
            # Add i months
            month = (venc_date.month + i - 1) % 12 + 1
            year = venc_date.year + (venc_date.month + i - 1) // 12
            venc_date = venc_date.replace(year=year, month=month)
        
        new_entry = SQLFinanceEntry(
            tenant_id=current_user.tenant_id,
            lead_id=entry.lead_id if entry.lead_id else None,
            category_id=entry.categoria if entry.categoria else None,
            type=entry.tipo,
            description=f"{entry.descricao} ({i+1}/{entry.parcelas})" if entry.parcelas > 1 else entry.descricao,
            origin=entry.origem,
            amount=round(entry.valor / entry.parcelas, 2),
            due_date=venc_date,
            status=entry.status if i == 0 else "pendente",
            payment_method=entry.forma_pagamento,
            installment_number=i + 1,
            total_installments=entry.parcelas,
            observations=entry.observacoes
        )
        db.add(new_entry)
        db.flush()
        results.append(new_entry)
    
    db.commit()
    
    # Return first installment
    return {
        "id": str(results[0].id),
        "data_vencimento": results[0].due_date.isoformat(),
        "descricao": results[0].description,
        "tipo": results[0].type,
        "valor": float(results[0].amount),
        "status": results[0].status,
        "origem": results[0].origin,
        "created_at": results[0].created_at.isoformat()
    }


@router.put("/finances/{finance_id}")
async def update_finance_status(
    finance_id: str,
    payload: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    entry = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.id == finance_id,
        SQLFinanceEntry.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    # Update allowed fields
    if "status" in payload:
        entry.status = payload["status"]
    if "forma_pagamento" in payload:
        entry.payment_method = payload["forma_pagamento"]
    if "data_pagamento" in payload:
        pass  # Would need to add field to model
    
    db.commit()
    db.refresh(entry)
    
    return {
        "id": str(entry.id),
        "data_vencimento": entry.due_date.isoformat(),
        "descricao": entry.description,
        "status": entry.status
    }


@router.delete("/finances/{finance_id}")
async def delete_finance(
    finance_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    entry = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.id == finance_id,
        SQLFinanceEntry.tenant_id == current_user.tenant_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail=f"Lançamento {finance_id} não encontrado")
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Deletado"}


# --- Categories CRUD ---

@router.get("/categories")
async def get_categories(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    categories = db.query(SQLFinanceCategory).filter(
        SQLFinanceCategory.tenant_id == current_user.tenant_id,
        SQLFinanceCategory.active == True
    ).all()
    
    return [
        {
            "id": str(cat.id),
            "nome": cat.name,
            "tipo": cat.type
        }
        for cat in categories
    ]


@router.post("/categories")
async def create_category(
    cat: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    new_cat = SQLFinanceCategory(
        tenant_id=current_user.tenant_id,
        name=cat.get("nome", ""),
        type=cat.get("tipo", "ambos"),
        active=True
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    return {
        "id": str(new_cat.id),
        "nome": new_cat.name,
        "tipo": new_cat.type
    }


@router.put("/categories/{cat_id}")
async def update_category(
    cat_id: str,
    cat_in: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    category = db.query(SQLFinanceCategory).filter(
        SQLFinanceCategory.id == cat_id,
        SQLFinanceCategory.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404)
    
    if "nome" in cat_in:
        category.name = cat_in["nome"]
    if "tipo" in cat_in:
        category.type = cat_in["tipo"]
    
    db.commit()
    db.refresh(category)
    
    return {
        "id": str(category.id),
        "nome": category.name,
        "tipo": category.type
    }


@router.delete("/categories/{cat_id}")
async def delete_category(
    cat_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    category = db.query(SQLFinanceCategory).filter(
        SQLFinanceCategory.id == cat_id,
        SQLFinanceCategory.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404)
    
    category.active = False  # Soft delete
    db.commit()
    
    return {"message": "Deletado"}


# --- Payment Methods (simple list, not stored in DB) ---

@router.get("/payment-methods")
async def get_payment_methods(current_user: TokenData = Depends(get_current_tenant_user)):
    return [
        {"id": "1", "nome": "PIX", "ativo": True},
        {"id": "2", "nome": "Dinheiro", "ativo": True},
        {"id": "3", "nome": "Cartão de Crédito", "ativo": True},
        {"id": "4", "nome": "Cartão de Débito", "ativo": True},
        {"id": "5", "nome": "Boleto", "ativo": True}
    ]


# --- Reports ---

@router.get("/reports/cashflow")
async def get_cashflow_report(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    entries = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.tenant_id == current_user.tenant_id,
        SQLFinanceEntry.status == "pago"
    ).all()
    
    # Simple monthly aggregation for the last 6 months
    today = date.today()
    report_data = []
    
    for i in range(5, -1, -1):
        # Calculate month and year
        m = (today.month - i - 1) % 12 + 1
        y = today.year + (today.month - i - 1) // 12
        month_str = f"{y}-{m:02d}"
        
        receitas = sum(
            float(e.amount) for e in entries
            if e.type == "receita" and e.due_date.strftime("%Y-%m") == month_str
        )
        despesas = sum(
            float(e.amount) for e in entries
            if e.type == "despesa" and e.due_date.strftime("%Y-%m") == month_str
        )
        
        report_data.append({
            "name": month_str,
            "receitas": receitas,
            "despesas": despesas,
            "saldo": round(receitas - despesas, 2)
        })
        
    return report_data


@router.get("/export")
async def export_finances(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    entries = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.tenant_id == current_user.tenant_id
    ).all()
    
    data = []
    for e in entries:
        data.append({
            "Data Vencimento": e.due_date.isoformat(),
            "Descrição": e.description,
            "Tipo": e.type,
            "Valor": float(e.amount),
            "Status": e.status,
            "Origem": e.origin,
            "Método Pagamento": e.payment_method
        })
    
    df = pd.DataFrame(data)
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
