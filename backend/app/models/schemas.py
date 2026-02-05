from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role_global: Optional[str] = None
    tenant_slug: Optional[str] = None
    tenant_id: Optional[str] = None
    role_local: Optional[str] = None

class MasterLogin(BaseModel):
    email: str
    password: str

class TenantLogin(BaseModel):
    email: str
    password: str
    tenant_slug: str

class SelectTenant(BaseModel):
    tenant_slug: str

class EnvironmentBase(BaseModel):
    nome_empresa: Optional[str] = None
    nome: Optional[str] = None # Legacy field
    slug: str
    cnpj: Optional[str] = None
    endereco: Optional[str] = None
    nicho_id: Optional[str] = None
    nicho: Optional[str] = None # Legacy field
    logo_url: Optional[str] = None
    cor_principal: Optional[str] = "#0055FF"
    plan: Optional[str] = "basic"
    payment_status: Optional[str] = "trial"
    modulos_habilitados: List[str] = []
    contract_generated_url: Optional[str] = None
    contract_signed_url: Optional[str] = None
    contract_status: Optional[str] = "pending_generation" # pending_generation, generated, signed

class EnvironmentCreate(EnvironmentBase):
    admin_email: str
    admin_password: str

class EnvironmentUpdate(BaseModel):
    nome_empresa: Optional[str] = None
    cnpj: Optional[str] = None
    endereco: Optional[str] = None
    nicho_id: Optional[str] = None
    plan: Optional[str] = None
    payment_status: Optional[str] = None
    ativo: Optional[bool] = None
    modulos_habilitados: Optional[List[str]] = None
    contract_status: Optional[str] = None

class Environment(EnvironmentBase):
    id: str
    excel_file: Optional[str] = ""
    ativo: Optional[bool] = False
    nome: Optional[str] = None

    class Config:
        extra = 'ignore'

class LeadBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    status: str = "new"  # new, contacted, converted, lost
    value: float = 0.0

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    id: str
    created_at: str

class DashboardStats(BaseModel):
    total_leads: int
    active_leads: int
    converted_leads: int
    conversion_rate: float
    total_revenue: float
    recent_leads: List[Lead]

class TenantAdminStats(BaseModel):
    nome: str
    slug: str
    plan: str
    payment_status: str
    ativo: bool
    user_count: int
    admin_email: str

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str
    role: str = "user"

class User(UserBase):
    id: Optional[str] = None
    role: str
    role_global: Optional[str] = None
    allowed_tenants: Optional[str] = None

class UserInDB(User):
    password_hash: str

class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str

class NicheCreate(BaseModel):
    name: str
    description: Optional[str] = None
    ativo: bool = True

class Niche(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    ativo: bool = True

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30
    value: float = 0.0
    primary_color: str = "#0055FF"
    active: bool = True

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    title: str
    start_time: Optional[str] = None # ISO format
    end_time: Optional[str] = None # ISO format
    appointment_date: Optional[str] = None # Legacy/Frontend compatibility
    customer_id: Optional[str] = None
    lead_id: Optional[str] = None
    user_id: Optional[str] = None
    staff_id: Optional[str] = None # Legacy/Frontend compatibility
    status: str = "scheduled" # scheduled, completed, cancelled
    description: Optional[str] = None
    
    # New Service/Billing fields
    service_id: Optional[str] = None
    service_duration_minutes: Optional[int] = 30
    service_value: Optional[float] = 0.0
    plan_id: Optional[str] = None
    billing_status: Optional[str] = "open"

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: str | uuid.UUID
    created_at: datetime | str
    start_time: Optional[datetime | str] = None
    end_time: Optional[datetime | str] = None
    customer_id: Optional[str | uuid.UUID] = None
    service_id: Optional[str | uuid.UUID] = None
    plan_id: Optional[str | uuid.UUID] = None
    
    class Config:
        from_attributes = True
