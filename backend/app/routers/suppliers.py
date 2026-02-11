from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models import schemas
from app.models.schemas import TokenData
from app.models.sql_models import Supplier, FinanceEntry

router = APIRouter(prefix="/tenant/suppliers", tags=["suppliers"])

@router.get("/", response_model=List[schemas.Supplier])
def get_suppliers(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Lista todos os fornecedores do tenant"""
    suppliers = db.query(Supplier).filter(
        Supplier.tenant_id == current_user.tenant_id
    ).order_by(Supplier.name).all()
    return suppliers

@router.get("/{supplier_id}", response_model=schemas.Supplier)
def get_supplier(
    supplier_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Busca um fornecedor específico"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == current_user.tenant_id
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    return supplier

@router.get("/{supplier_id}/debts")
def get_supplier_debts(
    supplier_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Busca todas as dívidas pendentes de um fornecedor"""
    # Verifica se o fornecedor existe
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == current_user.tenant_id
    ).first()
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    # Busca todas as despesas relacionadas ao fornecedor
    debts = db.query(FinanceEntry).filter(
        FinanceEntry.supplier_id == supplier_id,
        FinanceEntry.tenant_id == current_user.tenant_id,
        FinanceEntry.type == "despesa"
    ).order_by(FinanceEntry.due_date.desc()).all()
    
    # Calcula totais
    total_debt = sum(float(d.amount) for d in debts)
    pending_debt = sum(float(d.amount) for d in debts if d.status == "pendente")
    paid_debt = sum(float(d.amount) for d in debts if d.status == "pago")
    
    return {
        "supplier_id": str(supplier_id),
        "supplier_name": supplier.name,
        "total_debts": len(debts),
        "total_amount": total_debt,
        "pending_amount": pending_debt,
        "paid_amount": paid_debt,
        "debts": [
            {
                "id": str(d.id),
                "description": d.description,
                "amount": float(d.amount),
                "due_date": d.due_date.isoformat() if d.due_date else None,
                "status": d.status,
                "payment_method": d.payment_method,
                "installment_number": d.installment_number,
                "total_installments": d.total_installments,
                "observations": d.observations,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in debts
        ]
    }

@router.post("/", response_model=schemas.Supplier)
def create_supplier(
    supplier: schemas.SupplierCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Cria um novo fornecedor"""
    db_supplier = Supplier(
        **supplier.model_dump(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.put("/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(
    supplier_id: str,
    supplier: schemas.SupplierUpdate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Atualiza um fornecedor"""
    db_supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    update_data = supplier.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Remove um fornecedor"""
    db_supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    db.delete(db_supplier)
    db.commit()
    return {"message": "Fornecedor removido com sucesso"}
