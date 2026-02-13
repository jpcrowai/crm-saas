from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, text
from datetime import datetime, date, timedelta
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import FinanceEntry, Customer, Supplier, FinanceCategory

router = APIRouter(prefix="/tenant/financial-reports", tags=["financial_reports"])

@router.get("/customers")
async def get_customer_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    # Base query for receivables
    query = db.query(
        Customer.id,
        Customer.name,
        func.sum(case((FinanceEntry.status == 'pago', FinanceEntry.amount), else_=0)).label('total_paid'),
        func.sum(case((FinanceEntry.status == 'pendente', FinanceEntry.amount), else_=0)).label('total_open'),
        func.sum(case((FinanceEntry.status == 'atrasado', FinanceEntry.amount), else_=0)).label('total_overdue'),
        func.count(FinanceEntry.id).label('total_transactions')
    ).join(FinanceEntry, FinanceEntry.customer_id == Customer.id)\
     .filter(FinanceEntry.tenant_id == tenant_id, FinanceEntry.type == 'receita')
    
    if start_date:
        query = query.filter(FinanceEntry.due_date >= start_date)
    if end_date:
        query = query.filter(FinanceEntry.due_date <= end_date)
        
    results = query.group_by(Customer.id, Customer.name).order_by(desc('total_paid')).all()
    
    return [
        {
            "customer_id": str(r.id),
            "customer_name": r.name,
            "total_paid": float(r.total_paid or 0),
            "total_open": float(r.total_open or 0),
            "total_overdue": float(r.total_overdue or 0),
            "avg_ticket": float(r.total_paid / r.total_transactions) if r.total_transactions > 0 else 0
        }
        for r in results
    ]

@router.get("/suppliers")
async def get_supplier_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    query = db.query(
        Supplier.id,
        Supplier.name,
        func.sum(case((FinanceEntry.status == 'pago', FinanceEntry.amount), else_=0)).label('total_paid'),
        func.sum(case((FinanceEntry.status != 'pago', FinanceEntry.amount), else_=0)).label('total_open')
    ).join(FinanceEntry, FinanceEntry.supplier_id == Supplier.id)\
     .filter(FinanceEntry.tenant_id == tenant_id, FinanceEntry.type == 'despesa')
    
    if start_date:
        query = query.filter(FinanceEntry.due_date >= start_date)
    if end_date:
        query = query.filter(FinanceEntry.due_date <= end_date)
        
    results = query.group_by(Supplier.id, Supplier.name).order_by(desc('total_paid')).all()
    
    return [
        {
            "supplier_id": str(r.id),
            "supplier_name": r.name,
            "total_paid": float(r.total_paid or 0),
            "total_open": float(r.total_open or 0)
        }
        for r in results
    ]

@router.get("/cash-flow")
async def get_cash_flow_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    # Daily aggregation
    query = db.query(
        FinanceEntry.due_date,
        func.sum(case((FinanceEntry.type == 'receita', FinanceEntry.amount), else_=0)).label('income'),
        func.sum(case((FinanceEntry.type == 'despesa', FinanceEntry.amount), else_=0)).label('expense')
    ).filter(FinanceEntry.tenant_id == tenant_id, FinanceEntry.status == 'pago')
    
    if start_date:
        query = query.filter(FinanceEntry.due_date >= start_date)
    if end_date:
        query = query.filter(FinanceEntry.due_date <= end_date)
        
    results = query.group_by(FinanceEntry.due_date).order_by(FinanceEntry.due_date).all()
    
    return [
        {
            "date": r.due_date.isoformat(),
            "income": float(r.income or 0),
            "expense": float(r.expense or 0),
            "net": float((r.income or 0) - (r.expense or 0))
        }
        for r in results
    ]

@router.get("/pnl")
async def get_pnl_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    # Revenue
    revenue = db.query(func.sum(FinanceEntry.amount)).filter(
        FinanceEntry.tenant_id == tenant_id,
        FinanceEntry.type == 'receita',
        FinanceEntry.status == 'pago'
    )
    if start_date: revenue = revenue.filter(FinanceEntry.due_date >= start_date)
    if end_date: revenue = revenue.filter(FinanceEntry.due_date <= end_date)
    total_revenue = revenue.scalar() or 0.0

    # Expenses by category
    expenses_query = db.query(
        FinanceCategory.name,
        func.sum(FinanceEntry.amount).label('total')
    ).join(FinanceEntry, FinanceEntry.category_id == FinanceCategory.id)\
     .filter(FinanceEntry.tenant_id == tenant_id, FinanceEntry.type == 'despesa', FinanceEntry.status == 'pago')
     
    if start_date: expenses_query = expenses_query.filter(FinanceEntry.due_date >= start_date)
    if end_date: expenses_query = expenses_query.filter(FinanceEntry.due_date <= end_date)
    
    expenses_by_category = expenses_query.group_by(FinanceCategory.name).all()
    
    total_expenses = sum([r.total for r in expenses_by_category]) or 0.0
    
    return {
        "revenue": float(total_revenue),
        "expenses": float(total_expenses),
        "net_profit": float(total_revenue - total_expenses),
        "expense_breakdown": [{"category": r.name, "amount": float(r.total)} for r in expenses_by_category]
    }

@router.get("/aging")
async def get_aging_report(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    today = date.today()
    
    # Fetch all overdue or open receivables
    receivables = db.query(FinanceEntry).filter(
        FinanceEntry.tenant_id == tenant_id,
        FinanceEntry.type == 'receita',
        FinanceEntry.status.in_(['pendente', 'atrasado']),
        FinanceEntry.due_date < today
    ).all()
    
    buckets = {
        "0-30": 0,
        "31-60": 0,
        "61-90": 0,
        "90+": 0
    }
    
    for entry in receivables:
        days_overdue = (today - entry.due_date).days
        amount = float(entry.amount)
        
        if days_overdue <= 30:
            buckets["0-30"] += amount
        elif days_overdue <= 60:
            buckets["31-60"] += amount
        elif days_overdue <= 90:
            buckets["61-90"] += amount
        else:
            buckets["90+"] += amount
            
    return buckets
