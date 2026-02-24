from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from typing import List, Optional
import uuid
import json
import os
from datetime import datetime, timedelta
from app.models.schemas import Appointment as AppointmentSchema, AppointmentCreate, TokenData
from app.deps import get_current_tenant_user
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.sql_models import (
    Appointment as SQLAppointment, 
    Product as SQLProduct,
    Subscription as SQLSubscription,
    FinanceEntry as SQLFinanceEntry,
    FinanceCategory as SQLFinanceCategory,
    Customer as SQLCustomer
)
from app.services.excel_service import read_sheet, write_sheet # Keep for legacy configs if needed
from app.services.commission_service import calculate_commission

# Google API imports (Commented out to reduce deployment size)
# from google_auth_oauthlib.flow import Flow
# from googleapiclient.discovery import build
# from google.oauth2.credentials import Credentials
# from google.auth.transport.requests import Request as GoogleRequest

def build(*args, **kwargs):
    """Dummy build function for Google API stubbing."""
    return None

class Flow:
    """Dummy Flow class for Google API stubbing."""
    @classmethod
    def from_client_config(cls, *args, **kwargs):
        raise HTTPException(status_code=501, detail="Google Calendar integration temporarily disabled for size optimization")

class Credentials:
    """Dummy Credentials class for Google API stubbing."""
    @classmethod
    def from_authorized_user_info(cls, *args, **kwargs):
        return None

router = APIRouter(prefix="/tenant/appointments", tags=["appointments"])

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_config(tenant_slug: str):
    # 1. Try Global Config from ENV (Best for SaaS ease-of-use)
    global_id = os.getenv("GOOGLE_CLIENT_ID")
    global_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    # Redirect URI must match what's configured in Google Cloud Console
    global_redirect = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/google-callback")
    
    if global_id and global_secret:
        return {
            "client_id": global_id,
            "client_secret": global_secret,
            "redirect_uri": global_redirect
        }

    # 2. Fallback to Tenant-specific config (Legacy/White-label)
    try:
        configs = read_sheet(tenant_slug, "configs")
    except:
        try:
            configs = read_sheet(tenant_slug, "config")
        except:
            return None
            
    return next((c["value"] for c in configs if c.get("key") == "google_calendar"), None)

def get_credentials(tenant_slug: str):
    """Helper to get and refresh Google Credentials."""
    print(f"--- Debug: Getting credentials for {tenant_slug} ---")
    configs = []
    sheet_name = "configs"
    try:
        configs = read_sheet(tenant_slug, "configs")
    except Exception as e:
        print(f"--- Debug: Error reading configs sheet: {e} ---")
        try:
            configs = read_sheet(tenant_slug, "config")
            sheet_name = "config"
        except:
            return None, None

    creds_entry = next(((i, c["value"]) for i, c in enumerate(configs) if c.get("key") == "google_credentials"), (None, None))
    idx, google_creds_data = creds_entry
    
    if not google_creds_data:
        print(f"--- Debug: No google_credentials found in {sheet_name} for {tenant_slug} ---")
        return None, None

    try:
        creds = Credentials.from_authorized_user_info(google_creds_data, SCOPES)
        if creds and creds.expired and creds.refresh_token:
            print(f"--- Debug: Credentials expired, refreshing... ---")
            creds.refresh(GoogleRequest())
            # Update saved creds
            configs[idx]["value"] = json.loads(creds.to_json())
            write_sheet(tenant_slug, sheet_name, configs)
            print(f"--- Debug: Credentials refreshed and saved to {sheet_name} ---")
        
        service = build('calendar', 'v3', credentials=creds)
        return creds, service
    except Exception as e:
        print(f"--- Debug: Error in get_credentials: {e} ---")
        return None, None

@router.get("/", response_model=List[AppointmentSchema])
async def get_appointments(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # 1. Get Local Appointments from SQL
    from app.models.sql_models import Professional as SQLProfessional
    local_appts_models = db.query(SQLAppointment).outerjoin(
        SQLProfessional, SQLAppointment.professional_id == SQLProfessional.id
    ).filter(
        SQLAppointment.tenant_id == current_user.tenant_id
    ).all()
    
    local_appts = []
    for a in local_appts_models:
        # Convert SQLAlchemy model to Pydantic if needed (though response_model handles it)
        # But we need to handle the conversion to string for start_time if it's ISO on frontend
        # SQLAlchemy stores them as objects. Pydantic handles datetime -> str
        local_appts.append(a)

    # 2. Get Google Appointments if linked (Same logic as before)
    google_appts = []
    # ... (Google logic remains same but we need to append to local_appts)
    service = None
    try:
        creds, service = get_credentials(current_user.tenant_slug)
        if service:
            now = datetime.utcnow().isoformat() + 'Z'
            events_result = service.events().list(calendarId='primary', timeMin=now,
                                                maxResults=100, singleEvents=True,
                                                orderBy='startTime').execute()
            for event in events_result.get('items', []):
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                google_appts.append(AppointmentSchema(
                    id=f"google_{event['id']}",
                    created_at=datetime.now().isoformat(),
                    title=event.get('summary', '(Sem Título)'),
                    start_time=start,
                    end_time=end,
                    description=event.get('description', ''),
                    status='scheduled',
                    customer_id='google_event'
                ))
    except Exception as e:
        print(f"Error fetching Google Calendar: {e}")

    # 3. Deduplicate (Identical titles and times)
    final_appts = []
    seen_keys = set()
    
    # We prioritize Google ones because they are the "external truth"
    for g in google_appts:
        # Normalize time for comparison
        g_start = g.start_time
        key = (g.title.strip().lower(), str(g_start))
        seen_keys.add(key)
        final_appts.append(g)

    for l in local_appts:
        # Check if l is a model or a Pydantic object
        l_title = l.title
        l_start = l.start_time.isoformat() if hasattr(l.start_time, 'isoformat') else str(l.start_time)
        key = (l_title.strip().lower(), l_start)
        if key not in seen_keys:
            final_appts.append(l)

    # Sort final list
    # The response_model handles the conversion of SQLAlchemy objects to Pydantic
    return final_appts

@router.post("/", response_model=AppointmentSchema)
async def create_appointment(
    appt_in: AppointmentCreate, 
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    start = appt_in.start_time or appt_in.appointment_date
    if not start:
        raise HTTPException(status_code=400, detail="Data de agendamento é necessária")

    # Parse dates
    try:
        dt_start = datetime.fromisoformat(start.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Formato de data inválido")

    # 0. Check for collisions in SQL
    collision = db.query(SQLAppointment).filter(
        SQLAppointment.tenant_id == current_user.tenant_id,
        SQLAppointment.start_time >= dt_start - timedelta(seconds=59),
        SQLAppointment.start_time <= dt_start + timedelta(seconds=59)
    ).first()
    
    if collision:
        raise HTTPException(status_code=400, detail=f"Conflito de horário com: {collision.title}")

    # 1. Fetch Product/Service details (Required)
    service = db.query(SQLProduct).filter(
        SQLProduct.id == appt_in.service_id,
        SQLProduct.tenant_id == current_user.tenant_id
    ).first()
    if not service:
        raise HTTPException(status_code=400, detail="Serviço inválido ou inexistente")
    
    # 2. Set duration and value based on product
    # Use price for value
    duration = appt_in.service_duration_minutes or getattr(service, 'duration_minutes', 30) or 30
    value = appt_in.service_value or float(service.price or 0)
    dt_end = dt_start + timedelta(minutes=duration)

    # 3. Billing Logic
    billing_status = "open"
    if appt_in.plan_id:
        # Verify if it's an active plan for this customer (Subscription table)
        # Note: we check 'Subscription' which links customer and plan
        billing_status = "covered_by_plan"
        
    # SYNC CUSTOMER from Excel to SQL if missing (Hybrid Architecture Support)
    if appt_in.customer_id:
        cust_exists = db.query(SQLCustomer).filter(SQLCustomer.id == appt_in.customer_id).first()
        if not cust_exists:
            try:
                excel_data = read_sheet(current_user.tenant_slug, "customers")
                found = next((c for c in excel_data if str(c.get("id")) == str(appt_in.customer_id)), None)
                if found:
                    new_c = SQLCustomer(
                        id=found.get("id"),
                        tenant_id=current_user.tenant_id,
                        name=found.get("name") or "Cliente Sync",
                        email=found.get("email"),
                        phone=found.get("phone") or found.get("telefone"),
                        document=found.get("document") or found.get("cpf_cnpj"),
                        address=found.get("address")
                    )
                    db.add(new_c)
                    db.flush()
            except Exception as e:
                 print(f"Customer Sync Validaton Warning: {e}")
    
    new_appt = SQLAppointment(
        tenant_id=current_user.tenant_id,
        customer_id=appt_in.customer_id,
        professional_id=appt_in.professional_id,
        lead_id=appt_in.lead_id,
        user_id=appt_in.user_id,
        title=appt_in.title,
        description=appt_in.description,
        start_time=dt_start,
        end_time=dt_end,
        service_id=appt_in.service_id,
        service_duration_minutes=duration,
        service_value=value,
        plan_id=appt_in.plan_id if appt_in.plan_id else None,
        billing_status=billing_status,
        status="scheduled"
    )
    db.add(new_appt)
    db.flush()

    # 4. Create Finance Entry if not covered by plan
    if billing_status == "open":
        # Find or Create a category for Services
        cat = db.query(SQLFinanceCategory).filter(
            SQLFinanceCategory.tenant_id == current_user.tenant_id,
            SQLFinanceCategory.name == "Serviços"
        ).first()
        if not cat:
            cat = SQLFinanceCategory(tenant_id=current_user.tenant_id, name="Serviços", type="entrada")
            db.add(cat)
            db.flush()

        finance_entry = SQLFinanceEntry(
            tenant_id=current_user.tenant_id,
            category_id=cat.id,
            appointment_id=new_appt.id,
            customer_id=new_appt.customer_id,
            service_id=new_appt.service_id,
            type="receita",
            description=f"Serviço: {service.name} - Agenda ({new_appt.title})",
            origin="agenda",
            amount=value,
            due_date=dt_start.date(),
            status="pendente"
        )
        db.add(finance_entry)

    db.commit()
    db.refresh(new_appt)

    # 5. Push to Google Calendar (unchanged logic)
    # ... (Google logic remains but needs to use new_appt fields)

    try:
        creds, service_g = get_credentials(current_user.tenant_slug)
        if service_g:
            google_start = new_appt.start_time.isoformat()
            google_end = new_appt.end_time.isoformat()
            
            event = {
                'summary': f"{service.name}: {new_appt.title}",
                'description': new_appt.description,
                'start': {
                    'dateTime': google_start,
                    'timeZone': 'America/Sao_Paulo',
                },
                'end': {
                    'dateTime': google_end,
                    'timeZone': 'America/Sao_Paulo',
                },
            }
            service_g.events().insert(calendarId='primary', body=event).execute()
    except Exception as e:
        print(f"Error pushing to Google Calendar: {e}")

    return new_appt

@router.get("/customer-plans/{customer_id}")
async def get_customer_plans(
    customer_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get active plans (subscriptions) for a specific customer."""
    # Verify the customer belongs to this tenant
    # (Optional verification if customer_id lookup is done)
    
    # Query subscriptions with their related plans
    from app.models.sql_models import Plan as SQLPlan
    
    subs = db.query(SQLSubscription, SQLPlan).join(
        SQLPlan, SQLSubscription.plan_id == SQLPlan.id
    ).filter(
        SQLSubscription.tenant_id == current_user.tenant_id,
        SQLSubscription.customer_id == customer_id,
        SQLSubscription.status == "Ativa" # Match the status in subscriptions.py
    ).all()
    
    return [
        {
            "id": str(plan.id),
            "nome": plan.name,
            "subscription_id": str(sub.id)
        }
        for sub, plan in subs
    ]

@router.put("/{appt_id}", response_model=AppointmentSchema)
async def update_appointment(
    appt_id: str,
    appt_in: AppointmentCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    appt = db.query(SQLAppointment).filter(
        SQLAppointment.id == appt_id,
        SQLAppointment.tenant_id == current_user.tenant_id
    ).first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # Update logic (similar to create)
    start = appt_in.start_time or appt_in.appointment_date
    if start:
        try:
            dt_start = datetime.fromisoformat(start.replace('Z', '+00:00'))
            appt.start_time = dt_start
        except:
            raise HTTPException(status_code=400, detail="Formato de data inválido")

    if appt_in.service_id:
        service = db.query(SQLProduct).filter(
            SQLProduct.id == appt_in.service_id,
            SQLProduct.tenant_id == current_user.tenant_id
        ).first()
        if service:
            appt.service_id = appt_in.service_id
            appt.service_duration_minutes = appt_in.service_duration_minutes or getattr(service, 'duration_minutes', 30)
            appt.service_value = appt_in.service_value or float(service.price or 0)
    
    # Recalculate end_time if start or duration changed
    appt.end_time = appt.start_time + timedelta(minutes=appt.service_duration_minutes)
    
    # Update other fields
    appt.title = appt_in.title or appt.title
    appt.description = appt_in.description or appt.description
    appt.plan_id = appt_in.plan_id
    appt.billing_status = "covered_by_plan" if appt_in.plan_id else "open"
    appt.customer_id = appt_in.customer_id or appt.customer_id
    appt.professional_id = appt_in.professional_id or appt.professional_id
    
    db.commit()
    db.refresh(appt)
    return appt

@router.post("/{appt_id}/complete", response_model=AppointmentSchema)
async def complete_appointment(
    appt_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    appt = db.query(SQLAppointment).filter(
        SQLAppointment.id == appt_id,
        SQLAppointment.tenant_id == current_user.tenant_id
    ).first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    if appt.status == "completed":
        return appt

    appt.status = "completed"
    
    # Calculate Commission
    if appt.professional_id:
        calculate_commission(db, str(appt.id), str(current_user.tenant_id))
    
    # Update Finance Entry if exists
    finance_entry = db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.appointment_id == appt.id
    ).first()
    
    if finance_entry:
        finance_entry.status = "pago" # When completed, assume payment if linked
    
    db.commit()
    db.refresh(appt)
    return appt

@router.delete("/{appt_id}")
async def delete_appointment(
    appt_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    appt = db.query(SQLAppointment).filter(
        SQLAppointment.id == appt_id,
        SQLAppointment.tenant_id == current_user.tenant_id
    ).first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
    # Also delete linked finance entry if still pending
    db.query(SQLFinanceEntry).filter(
        SQLFinanceEntry.appointment_id == appt.id,
        SQLFinanceEntry.status == "pendente"
    ).delete()
    
    db.delete(appt)
    db.commit()
    return {"message": "Deletado com sucesso"}
@router.get("/auth-url")
async def get_auth_url(current_user: TokenData = Depends(get_current_tenant_user)):
    """Generate the Google OAuth authorization URL."""
    config = get_google_config(current_user.tenant_slug)
    if not config:
        raise HTTPException(status_code=400, detail="Google Calendar não configurado")
    
    # Ensure redirect_uri is what's expected
    redirect_uri = config.get("redirect_uri", "http://localhost:5173/google-callback")
    
    client_config = {
        "web": {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = redirect_uri
    
    # CRITICAL: access_type='offline' and prompt='consent' ensure we get a refresh token
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        include_granted_scopes='true',
        state=current_user.tenant_slug
    )
    
    return {"url": auth_url}

@router.post("/callback")
async def google_callback(data: dict, current_user: TokenData = Depends(get_current_tenant_user)):
    """Handle the OAuth callback and exchange code for tokens."""
    code = data.get("code")
    state = data.get("state")
    
    print(f"--- Debug: google_callback called for {current_user.tenant_slug} ---")
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorização ausente")
    
    config = get_google_config(current_user.tenant_slug)
    if not config:
        raise HTTPException(status_code=400, detail="Configuração do Google não encontrada")

    redirect_uri = config.get("redirect_uri", "http://localhost:5173/google-callback")

    client_config = {
        "web": {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }

    try:
        flow = Flow.from_client_config(client_config, scopes=SCOPES)
        flow.redirect_uri = redirect_uri
        
        print(f"--- Debug: Exchanging code for tokens... ---")
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # Save credentials to tenant file (configs sheet)
        sheet_name = "configs"
        try:
            read_sheet(current_user.tenant_slug, "configs")
        except:
            sheet_name = "config"
            
        configs = read_sheet(current_user.tenant_slug, sheet_name)
        configs = [c for c in configs if c.get("key") != "google_credentials"]
        configs.append({
            "key": "google_credentials",
            "value": json.loads(creds.to_json()),
            "updated_at": datetime.now().isoformat()
        })
        
        write_sheet(current_user.tenant_slug, sheet_name, configs)
        print(f"--- Debug: Credentials saved successfully for {current_user.tenant_slug} ---")
        
        return {"status": "success", "message": "Agenda vinculada com sucesso"}
    except Exception as e:
        print(f"--- Debug: Error in code exchange: {e} ---")
        raise HTTPException(status_code=500, detail=f"Erro na troca do código: {str(e)}")

@router.get("/calendar-info")
async def get_calendar_info(current_user: TokenData = Depends(get_current_tenant_user)):
    """Retrieve info about the connected Google account."""
    try:
        creds, service = get_credentials(current_user.tenant_slug)
        if service:
            # We can get the user's email from the calendar service
            # 'primary' is the primary calendar, its ID is usually the email
            calendar = service.calendars().get(calendarId='primary').execute()
            return {
                "connected": True,
                "email": calendar.get("id"), # Usually the email
                "summary": calendar.get("summary")
            }
    except Exception as e:
        print(f"--- Debug: Error fetching calendar info: {e} ---")
    
    return {"connected": False}

@router.post("/config")
async def save_google_calendar_config(config: dict, current_user: TokenData = Depends(get_current_tenant_user)):
    """Save and VALIDATE Google Calendar API credentials."""
    # Strip whitespace from inputs (common user error)
    client_id = config.get("client_id", "").strip()
    client_secret = config.get("client_secret", "").strip()
    redirect_uri = config.get("redirect_uri", "").strip()
    
    # Update config with stripped values
    config["client_id"] = client_id
    config["client_secret"] = client_secret
    config["redirect_uri"] = redirect_uri
    
    print(f"--- Debug: Validating Google Config for {current_user.tenant_slug} ---")
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=400, detail="Client ID, Secret e Redirect URI são obrigatórios")

    # Basic format check
    if ".apps.googleusercontent.com" not in client_id:
        raise HTTPException(status_code=400, detail="O Client ID parece inválido. Ele deve terminar com .apps.googleusercontent.com")

    # Attempt to validate with Google libraries
    try:
        client_config = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }
        # This checks if the config structure meets library requirements
        Flow.from_client_config(client_config, scopes=SCOPES)
        print("--- Debug: Google Config structure is valid ---")
    except Exception as e:
        print(f"--- Debug: Invalid Google Config structure: {e} ---")
        raise HTTPException(status_code=400, detail=f"As credenciais têm formato inválido: {str(e)}")

    # Standardize writing to 'configs'
    try:
        data = read_sheet(current_user.tenant_slug, "configs")
    except:
        data = []
        
    data = [c for c in data if c.get("key") != "google_calendar"]
    data.append({
        "key": "google_calendar",
        "value": config,
        "updated_at": datetime.now().isoformat()
    })
    write_sheet(current_user.tenant_slug, "configs", data)
    return {"status": "success", "message": "Configurações validadas e salvas com sucesso"}
