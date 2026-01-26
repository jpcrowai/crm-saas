from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
from datetime import datetime
from app.models.schemas import Appointment, AppointmentCreate, TokenData
from app.deps import get_current_tenant_user
from app.services.excel_service import read_sheet, write_sheet

router = APIRouter(prefix="/tenant/appointments", tags=["appointments"])

@router.get("/", response_model=List[Appointment])
async def get_appointments(current_user: TokenData = Depends(get_current_tenant_user)):
    data = read_sheet(current_user.tenant_slug, "appointments")
    return [Appointment(**a) for a in data]

@router.post("/", response_model=Appointment)
async def create_appointment(appt_in: AppointmentCreate, current_user: TokenData = Depends(get_current_tenant_user)):
    data = read_sheet(current_user.tenant_slug, "appointments")
    
    new_appt = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat(),
        "title": appt_in.title,
        "start_time": appt_in.start_time,
        "end_time": appt_in.end_time,
        "customer_id": appt_in.customer_id,
        "staff_id": appt_in.staff_id,
        "status": appt_in.status,
        "description": appt_in.description or ""
    }
    
    data.append(new_appt)
    write_sheet(current_user.tenant_slug, "appointments", data)
    return Appointment(**new_appt)

@router.put("/{appt_id}", response_model=Appointment)
async def update_appointment(appt_id: str, appt_in: AppointmentCreate, current_user: TokenData = Depends(get_current_tenant_user)):
    data = read_sheet(current_user.tenant_slug, "appointments")
    
    idx = next((i for i, a in enumerate(data) if a["id"] == appt_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appt = data[idx]
    # Update fields
    appt["title"] = appt_in.title
    appt["start_time"] = appt_in.start_time
    appt["end_time"] = appt_in.end_time
    appt["customer_id"] = appt_in.customer_id
    appt["staff_id"] = appt_in.staff_id
    appt["status"] = appt_in.status
    appt["description"] = appt_in.description
    
    data[idx] = appt
    write_sheet(current_user.tenant_slug, "appointments", data)
    return Appointment(**appt)
