from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from typing import List, Optional
import uuid
import json
import os
from datetime import datetime, timedelta
from app.models.schemas import Appointment, AppointmentCreate, TokenData
from app.deps import get_current_tenant_user
from app.services.excel_service import read_sheet, write_sheet

# Google API imports
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest

router = APIRouter(prefix="/tenant/appointments", tags=["appointments"])

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_config(tenant_slug: str):
    try:
        # Check both names for compatibility
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

@router.get("/", response_model=List[Appointment])
async def get_appointments(current_user: TokenData = Depends(get_current_tenant_user)):
    # 1. Get Local Appointments
    data = read_sheet(current_user.tenant_slug, "appointments")
    local_appts = []
    for a in data:
        try:
            if not a.get("start_time") and a.get("appointment_date"):
                a["start_time"] = a["appointment_date"]
            local_appts.append(Appointment(**a))
        except:
            continue

    # 2. Get Google Appointments if linked
    google_appts = []
    service = None
    try:
        creds, service = get_credentials(current_user.tenant_slug)
        if service:
            print(f"--- Debug: Service created, fetching events... ---")
            now = datetime.utcnow().isoformat() + 'Z'
            events_result = service.events().list(calendarId='primary', timeMin=now,
                                                maxResults=100, singleEvents=True,
                                                orderBy='startTime').execute()
            events = events_result.get('items', [])
            print(f"--- Debug: Found {len(events)} Google events ---")

            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                google_appts.append(Appointment(
                    id=f"google_{event['id']}",
                    created_at=datetime.now().isoformat(),
                    title=event.get('summary', '(Sem Título)'),
                    start_time=start,
                    end_time=end,
                    description=event.get('description', ''),
                    status='scheduled',
                    customer_id='google_event'
                ))
        else:
            print(f"--- Debug: Google service not available (not linked?) ---")
    except Exception as e:
        print(f"--- Debug: Critical error fetching Google Calendar: {e} ---")

    return local_appts + google_appts

@router.post("/", response_model=Appointment)
async def create_appointment(appt_in: AppointmentCreate, current_user: TokenData = Depends(get_current_tenant_user)):
    data = read_sheet(current_user.tenant_slug, "appointments")
    
    start = appt_in.start_time or appt_in.appointment_date
    if not start:
        raise HTTPException(status_code=400, detail="Data de agendamento é necessária")

    # 1. Save to Excel
    new_appt = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat(),
        "title": appt_in.title,
        "start_time": start,
        "end_time": appt_in.end_time or (datetime.fromisoformat(start.replace('Z', '+00:00')) + timedelta(hours=1)).isoformat(),
        "customer_id": appt_in.customer_id,
        "staff_id": appt_in.staff_id,
        "status": appt_in.status,
        "description": appt_in.description or ""
    }
    
    data.append(new_appt)
    write_sheet(current_user.tenant_slug, "appointments", data)

    # 2. Push to Google Calendar if linked
    try:
        creds, service = get_credentials(current_user.tenant_slug)
        if service:
            event = {
                'summary': new_appt['title'],
                'description': new_appt['description'],
                'start': {
                    'dateTime': new_appt['start_time'],
                    'timeZone': 'UTC', # Standard
                },
                'end': {
                    'dateTime': new_appt['end_time'],
                    'timeZone': 'UTC',
                },
            }
            service.events().insert(calendarId='primary', body=event).execute()
    except Exception as e:
        print(f"Error pushing to Google Calendar: {e}")
        # We don't fail the request if Google push fails, but we log it

    return Appointment(**new_appt)
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
