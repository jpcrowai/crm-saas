from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime
from pydantic import BaseModel
from app.deps import get_current_tenant_user
from app.models.schemas import Lead, LeadCreate, DashboardStats, TokenData
from app.services.excel_service import read_sheet, write_sheet

router = APIRouter(prefix="/tenant", tags=["tenant_data"])

class LeadHistory(BaseModel):
    id: Optional[str] = None
    lead_id: str
    type: str # call, whatsapp, meeting, note, stage_change
    description: str
    user_name: str
    created_at: str

class LeadTask(BaseModel):
    id: Optional[str] = None
    lead_id: str
    title: str
    due_date: str
    responsible_user: str
    status: str = "pending" # pending, completed
    created_at: str

# Ensure sub-sheets exist
def ensure_tenant_sheets(tenant_slug: str):
    for sheet in ["leads", "lead_history", "lead_tasks", "customers", "appointments"]:
        try:
            read_sheet(tenant_slug, sheet)
        except:
            write_sheet(tenant_slug, sheet, [])

def sync_customer_from_lead(tenant_slug: str, lead_data: Dict[str, Any]):
    """Ensure a lead is also represented in the customers sheet."""
    customers = read_sheet(tenant_slug, "customers")
    
    # Try to match by email or phone or ID
    existing_idx = -1
    lead_email = lead_data.get("email")
    lead_phone = lead_data.get("phone") or lead_data.get("telefone")
    lead_id = lead_data.get("id")
    
    for i, c in enumerate(customers):
        if lead_id and c.get("lead_id") == lead_id:
            existing_idx = i
            break
        if lead_email and c.get("email") == lead_email:
            existing_idx = i
            break
        # Match by phone if clean digits match
        if lead_phone:
            clean = lambda p: "".join(filter(str.isdigit, str(p)))
            if clean(c.get("phone") or c.get("telefone") or "") == clean(lead_phone):
                existing_idx = i
                break

    cust_data = {
        "name": lead_data.get("name") or lead_data.get("nome") or "Lead Importado",
        "email": lead_email or "",
        "phone": lead_phone or "",
        "status": "Lead" if lead_data.get("status") != "converted" else "Ativo",
        "lead_id": lead_id,
        "updated_at": datetime.now().isoformat()
    }

    if existing_idx != -1:
        customers[existing_idx].update(cust_data)
    else:
        cust_data["id"] = str(uuid.uuid4())
        cust_data["created_at"] = datetime.now().isoformat()
        customers.append(cust_data)
    
    write_sheet(tenant_slug, "customers", customers)

@router.get("/niche-config")
async def get_niche_config(current_user: TokenData = Depends(get_current_tenant_user)):
    """Get niche configuration including pipeline stages for tenant's environment."""
    # Get environment info
    ambientes = read_sheet("ambientes", "ambientes")
    env = next((a for a in ambientes if a["slug"] == current_user.tenant_slug), None)
    
    if not env:
        return {"pipeline_stages": ["Novo", "Em Contato", "Agendado"]}

    # 1. First check if environment has custom override
    custom_stages = env.get("custom_pipeline_stages")
    if custom_stages:
        if isinstance(custom_stages, str):
            try: custom_stages = json.loads(custom_stages.replace("'", '"'))
            except: pass
        if isinstance(custom_stages, list):
            return {
                "niche_name": env.get("nicho") or "Custom",
                "pipeline_stages": custom_stages
            }

    # 2. Fallback to Niche config
    niche_id = env.get("niche_id") or env.get("nicho")
    if not niche_id:
        return {"pipeline_stages": ["Novo", "Em Contato", "Agendado"]}
    
    # Get niche config
    niches = read_sheet("niches", "niches")
    niche = next((n for n in niches if n.get("id") == niche_id or n.get("name") == niche_id), None)
    
    if not niche:
        return {"pipeline_stages": ["Novo", "Em Contato", "Agendado"]}
    
    # Parse pipeline stages
    stages = niche.get("pipeline_stages")
    if isinstance(stages, str):
        try:
            stages = json.loads(stages)
        except:
            stages = ["Novo", "Em Contato", "Agendado"]
    
    return {
        "niche_name": niche.get("name"),
        "pipeline_stages": stages or ["Novo", "Em Contato", "Agendado"]
    }

@router.post("/pipeline-stages")
async def save_pipeline_stages(data: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    stages = data.get("stages")
    if not isinstance(stages, list):
        raise HTTPException(status_code=400, detail="Stages must be a list")
    
    # Update ambientes sheet with custom override
    ambientes = read_sheet("ambientes", "ambientes")
    idx = next((i for i, a in enumerate(ambientes) if a["slug"] == current_user.tenant_slug), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    ambientes[idx]["custom_pipeline_stages"] = json.dumps(stages)
    write_sheet("ambientes", "ambientes", ambientes)
    
    return {"status": "success", "stages": stages}

@router.get("/leads")
async def get_leads(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    leads = read_sheet(current_user.tenant_slug, "leads")
    return leads

@router.post("/leads")
async def create_lead(lead_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    leads = read_sheet(current_user.tenant_slug, "leads")
    
    new_lead = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat()
    }
    new_lead.update(lead_in)
    
    leads.append(new_lead)
    write_sheet(current_user.tenant_slug, "leads", leads)
    
    # Sync with customers
    sync_customer_from_lead(current_user.tenant_slug, new_lead)
    
    # Log initial history
    history = read_sheet(current_user.tenant_slug, "lead_history")
    history.append({
        "id": str(uuid.uuid4()),
        "lead_id": new_lead["id"],
        "type": "note",
        "description": "Lead criado no sistema",
        "user_name": current_user.email,
        "created_at": datetime.now().isoformat()
    })
    write_sheet(current_user.tenant_slug, "lead_history", history)
    
    return new_lead

@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, lead_update: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    leads = read_sheet(current_user.tenant_slug, "leads")
    lead_idx = next((i for i, l in enumerate(leads) if l.get("id") == lead_id), -1)
    
    if lead_idx == -1:
         raise HTTPException(status_code=404, detail="Lead not found")
         
    old_lead = leads[lead_idx]
    old_status = old_lead.get("status") or old_lead.get("status_lead")
    
    # Update
    leads[lead_idx].update(lead_update)
    new_lead = leads[lead_idx]
    new_status = new_lead.get("status") or new_lead.get("status_lead")
    
    write_sheet(current_user.tenant_slug, "leads", leads)
    
    # Sync with customers
    sync_customer_from_lead(current_user.tenant_slug, new_lead)
    
    # Log stage change if status changed
    if new_status and old_status and new_status != old_status:
        history = read_sheet(current_user.tenant_slug, "lead_history")
        history.append({
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "type": "stage_change",
            "description": f"Mudança de etapa: {old_status} -> {new_status}",
            "user_name": current_user.email,
            "created_at": datetime.now().isoformat()
        })
        write_sheet(current_user.tenant_slug, "lead_history", history)
        
    return new_lead

@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: TokenData = Depends(get_current_tenant_user)):
    leads = read_sheet(current_user.tenant_slug, "leads")
    
    total_leads = len(leads)
    active_leads = len([l for l in leads if l["status"] in ["new", "contacted"]])
    converted_leads = len([l for l in leads if l["status"] == "converted"])
    
    revenue = sum(float(l["value"]) for l in leads if l["status"] == "converted")
    
    conversion_rate = 0.0
    if total_leads > 0:
        conversion_rate = (converted_leads / total_leads) * 100
        
    # Sort by date desc for recent
    sorted_leads = sorted(leads, key=lambda x: x.get("created_at", ""), reverse=True)
    recent = [Lead(**l) for l in sorted_leads[:5]]
    
    return DashboardStats(
        total_leads=total_leads,
        active_leads=active_leads,
        converted_leads=converted_leads,
        conversion_rate=round(conversion_rate, 2),
        total_revenue=revenue,
        recent_leads=recent
    )

from app.models.schemas import TenantAdminStats
from app.deps import get_current_master

@router.get("/admin-stats", response_model=TenantAdminStats)
async def get_admin_stats(current_user: TokenData = Depends(get_current_master)):
    # This endpoint requires Master role (enforced by dependency)
    # It reads from the tenant context (current_user.tenant_slug)
    
    if not current_user.tenant_slug:
         raise HTTPException(status_code=400, detail="Not in tenant context")

    # 1. Get Environment Info from master excel
    ambientes = read_sheet("ambientes", "ambientes")
    env = next((a for a in ambientes if a["slug"] == current_user.tenant_slug), None)
    
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
        
    # 2. Get User Count from tenant excel
    users = read_sheet(current_user.tenant_slug, "users")
    
    # 3. Get Admin Email (usually the first user created or find role=admin)
    admin_email = "N/A"
    admin_user = next((u for u in users if u.get("role") == "admin"), None)
    if admin_user:
        admin_email = admin_user.get("email")

    return TenantAdminStats(
        nome=env.get("nome") or "Sem Nome",
        slug=env.get("slug") or "unknown",
        plan=env.get("plan") or "basic",
        payment_status=env.get("payment_status") or "trial",
        ativo=bool(env.get("ativo")) if env.get("ativo") is not None else True,
        user_count=len(users),
        admin_email=admin_email or "N/A"
    )

class RevenuePoint(BaseModel):
    name: str # Month/Date
    value: float

@router.get("/revenue-chart", response_model=List[RevenuePoint])
async def get_revenue_chart(current_user: TokenData = Depends(get_current_tenant_user)):
    leads = read_sheet(current_user.tenant_slug, "leads")
    
    # Aggregate by month
    # Format: "Jan 24"
    monthly_data = {}
    
    for lead in leads:
        if lead.get("status") == "converted":
            try:
                dt = datetime.fromisoformat(lead["created_at"])
                key = dt.strftime("%b %y") # e.g. Jan 24
                # We need to sort correctly, so maybe use YYYY-MM as key and format later?
                # For simplicity, let's just collect and return. 
                # If we want chronological, we might need a better key structure or just sort by date.
                
                sort_key = dt.strftime("%Y-%m")
                
                if sort_key not in monthly_data:
                    monthly_data[sort_key] = {"val": 0.0, "display": key}
                
                val = float(lead.get("value", 0))
                monthly_data[sort_key]["val"] += val
            except:
                pass
                
    # Sort by YYYY-MM key
    sorted_keys = sorted(monthly_data.keys())
    
    return [
        RevenuePoint(name=monthly_data[k]["display"], value=monthly_data[k]["val"]) 
        for k in sorted_keys
    ]

@router.get("/leads/{lead_id}/history")
async def get_lead_history(lead_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    history = read_sheet(current_user.tenant_slug, "lead_history")
    return [h for h in history if h.get("lead_id") == lead_id]

@router.post("/leads/{lead_id}/history")
async def add_lead_history(lead_id: str, item_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    history = read_sheet(current_user.tenant_slug, "lead_history")
    new_item = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "type": item_in.get("type", "note"),
        "description": item_in.get("description", ""),
        "user_name": current_user.email,
        "created_at": datetime.now().isoformat()
    }
    history.append(new_item)
    write_sheet(current_user.tenant_slug, "lead_history", history)
    return new_item

@router.get("/leads/{lead_id}/tasks")
async def get_lead_tasks(lead_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    tasks = read_sheet(current_user.tenant_slug, "lead_tasks")
    return [t for t in tasks if t.get("lead_id") == lead_id]

@router.post("/leads/{lead_id}/tasks")
async def create_lead_task(lead_id: str, task_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    tasks = read_sheet(current_user.tenant_slug, "lead_tasks")
    new_task = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "title": task_in.get("title", ""),
        "due_date": task_in.get("due_date", ""),
        "responsible_user": task_in.get("responsible_user", current_user.email),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    tasks.append(new_task)
    write_sheet(current_user.tenant_slug, "lead_tasks", tasks)
    return new_task

@router.put("/tasks/{task_id}")
async def update_task(task_id: str, task_update: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    tasks = read_sheet(current_user.tenant_slug, "lead_tasks")
    idx = next((i for i, t in enumerate(tasks) if t.get("id") == task_id), -1)
    if idx == -1: raise HTTPException(status_code=404)
    tasks[idx].update(task_update)
    write_sheet(current_user.tenant_slug, "lead_tasks", tasks)
    return tasks[idx]

@router.post("/leads/import-excel")
async def import_leads_excel(file: UploadFile = File(...), current_user: TokenData = Depends(get_current_tenant_user)):
    import pandas as pd
    from io import BytesIO
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel")
        
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Mapeamento robusto (lowercase e trim)
        mapping = {
            "nome": ["nome", "lead", "cliente", "name"],
            "telefone": ["telefone", "celular", "whatsapp", "phone", "tel"],
            "email": ["email", "e-mail", "mail"],
            "origem": ["origem", "source", "canal"],
            "responsavel": ["responsavel", "dono", "owner", "responsible"],
            "status": ["status", "etapa", "stage"],
            "valor": ["valor", "oportunidade", "value", "price"],
            "observacoes": ["observacoes", "notas", "obs", "notes"]
        }
        
        def find_col(possible_names):
            for col in df.columns:
                if col.lower().strip() in possible_names:
                    return col
            return None

        actual_mapping = {custom: find_col(standards) for custom, standards in mapping.items()}
        
        ensure_tenant_sheets(current_user.tenant_slug)
        leads = read_sheet(current_user.tenant_slug, "leads")
        history = read_sheet(current_user.tenant_slug, "lead_history")
        
        stats = {"created": 0, "updated": 0, "errors": 0}
        
        for _, row in df.iterrows():
            try:
                lead_data = {key: str(row[col]) if col and pd.notnull(row[col]) else "" for key, col in actual_mapping.items()}
                
                # Check for existing
                existing_idx = -1
                for i, l in enumerate(leads):
                    # Match by Name + Phone (cleaned)
                    clean_phone = lambda p: "".join(filter(str.isdigit, str(p)))
                    if l.get("nome", "").lower() == lead_data["nome"].lower() and \
                       clean_phone(l.get("telefone", "")) == clean_phone(lead_data["telefone"]):
                        existing_idx = i
                        break
                
                if existing_idx != -1:
                    leads[existing_idx].update(lead_data)
                    stats["updated"] += 1
                    history.append({
                        "id": str(uuid.uuid4()),
                        "lead_id": leads[existing_idx]["id"],
                        "type": "note",
                        "description": "Atualizado via importação Excel",
                        "user_name": current_user.email,
                        "created_at": datetime.now().isoformat()
                    })
                else:
                    new_id = str(uuid.uuid4())
                    new_lead = {"id": new_id, "created_at": datetime.now().isoformat()}
                    new_lead.update(lead_data)
                    leads.append(new_lead)
                    stats["created"] += 1
                    history.append({
                        "id": str(uuid.uuid4()),
                        "lead_id": new_id,
                        "type": "note",
                        "description": "Criado via importação Excel",
                        "user_name": current_user.email,
                        "created_at": datetime.now().isoformat()
                    })
            except Exception as e:
                print(f"Error importing row: {e}")
                stats["errors"] += 1
                
        write_sheet(current_user.tenant_slug, "leads", leads)
        write_sheet(current_user.tenant_slug, "lead_history", history)
        
        # Sync all with customers after batch
        for l in leads:
            sync_customer_from_lead(current_user.tenant_slug, l)
        
        return {
            "message": "Importação concluída",
            "created": stats["created"],
            "updated": stats["updated"],
            "errors": stats["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers")
async def get_customers(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    customers = read_sheet(current_user.tenant_slug, "customers")
    return customers

@router.post("/customers")
async def create_customer(customer_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    customers = read_sheet(current_user.tenant_slug, "customers")
    new_cust = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat()
    }
    new_cust.update(customer_in)
    customers.append(new_cust)
    write_sheet(current_user.tenant_slug, "customers", customers)
    return new_cust

@router.delete("/customers/{cust_id}")
async def delete_customer(cust_id: str, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_tenant_sheets(current_user.tenant_slug)
    customers = read_sheet(current_user.tenant_slug, "customers")
    idx = next((i for i, c in enumerate(customers) if str(c.get("id")) == str(cust_id)), -1)
    if idx == -1: raise HTTPException(status_code=404)
    customers.pop(idx)
    write_sheet(current_user.tenant_slug, "customers", customers)
    return {"message": "Deletado"}

@router.get("/reports")
async def get_reports(current_user: TokenData = Depends(get_current_tenant_user)):
    # Simple aggregation for the dashboard/reports view
    leads = read_sheet(current_user.tenant_slug, "leads")
    
    # Try reading finances from same file if exists, or use default []
    try:
        from app.routers.finances import ensure_finance_sheets
        ensure_finance_sheets(current_user.tenant_slug)
        finances = read_sheet(current_user.tenant_slug, "finances")
    except:
        finances = []

    try:
        customers = read_sheet(current_user.tenant_slug, "customers")
    except:
        customers = []

    total_leads = len(leads)
    
    # Calculate revenue from CONFIRMED financial transactions (receitas pagas)
    total_revenue = sum(float(f.get("valor", 0)) for f in finances if f.get("tipo") == "receita" and f.get("status") == "pago")
    
    # Calculate expenses from CONFIRMED financial transactions (despesas pagas)
    total_expenses = sum(float(f.get("valor", 0)) for f in finances if f.get("tipo") == "despesa" and f.get("status") == "pago")
    
    # Customer ranking (from finances if possible)
    ranking = []
    if finances:
        cust_totals = {}
        for f in finances:
            if f.get("tipo") == "receita" and f.get("status") == "pago":
                cid = f.get("customer_id") or "venda_avulsa"
                cust_totals[cid] = cust_totals.get(cid, 0) + float(f.get("valor", 0))
        
        # Sort and take top 5
        sorted_custs = sorted(cust_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        for cid, total in sorted_custs:
            # Try find name in customers or leads
            name = "Cliente Desconhecido"
            cust = next((c for c in customers if c.get("id") == cid), None)
            if cust: name = cust.get("name") or cust.get("nome")
            else:
                lead = next((l for l in leads if l.get("id") == cid), None)
                if lead: name = lead.get("name") or lead.get("nome")
            
            ranking.append({"customer_name": name, "total_revenue": total})

    return {
        "total_leads": total_leads,
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "customer_ranking": ranking
    }
