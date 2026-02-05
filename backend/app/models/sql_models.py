from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Numeric, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

def generate_uuid():
    return uuid.uuid4()

class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    business_name = Column(String)
    document = Column(String)
    address = Column(Text)
    niche_id = Column(UUID(as_uuid=True), ForeignKey("public.niches.id", ondelete="SET NULL"), nullable=True)
    logo_url = Column(Text)
    primary_color = Column(String, default="#0055FF")
    plan_tier = Column(String, default="basic")
    payment_status = Column(String, default="trial")
    contract_generated_url = Column(Text)
    contract_signed_url = Column(Text)
    contract_status = Column(String, default="pending_generation")
    modulos_habilitados = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="tenant", cascade="all, delete")
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete")
    customers = relationship("Customer", back_populates="tenant", cascade="all, delete")
    products = relationship("Product", back_populates="tenant", cascade="all, delete")
    plans = relationship("Plan", back_populates="tenant", cascade="all, delete")
    finance_categories = relationship("FinanceCategory", back_populates="tenant", cascade="all, delete")
    payment_methods = relationship("PaymentMethod", back_populates="tenant", cascade="all, delete")
    finance_entries = relationship("FinanceEntry", back_populates="tenant", cascade="all, delete")
    pipeline_stages = relationship("PipelineStage", back_populates="tenant", cascade="all, delete")
    integrations = relationship("Integration", back_populates="tenant", cascade="all, delete")
    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete")
    appointments = relationship("Appointment", back_populates="tenant", cascade="all, delete")
    subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete")
    niche = relationship("Niche", back_populates="tenants")


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=True) # Valid to be NULL for Master Superadmins
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    is_master = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="users")
    notifications = relationship("Notification", back_populates="user")


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    status = Column(String, default="new")
    value = Column(Numeric(12, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="leads")
    finance_entries = relationship("FinanceEntry", back_populates="lead")
    appointments = relationship("Appointment", back_populates="lead")


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    document = Column(String)
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="customers")
    subscriptions = relationship("Subscription", back_populates="customer")
    appointments = relationship("Appointment", back_populates="customer")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Numeric(12, 2), default=0.00)
    type = Column(String, default="product") # product, service
    duration_minutes = Column(Integer, default=30)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="products")
    plan_items = relationship("PlanItem", back_populates="product")


class Plan(Base):
    __tablename__ = "plans"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    base_price = Column(Numeric(12, 2), nullable=False)
    periodicity = Column(String, default="monthly")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="plans")
    items = relationship("PlanItem", back_populates="plan", cascade="all, delete")
    subscriptions = relationship("Subscription", back_populates="plan")


class PlanItem(Base):
    __tablename__ = "plan_items"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("public.plans.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("public.products.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, default=1)
    frequency = Column(String, default="monthly")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("Plan", back_populates="items")
    product = relationship("Product", back_populates="plan_items")


class FinanceCategory(Base):
    __tablename__ = "finance_categories"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # entrada, saida, ambos
    active = Column(Boolean, default=True)

    tenant = relationship("Tenant", back_populates="finance_categories")


class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    active = Column(Boolean, default=True)

    tenant = relationship("Tenant", back_populates="payment_methods")


class FinanceEntry(Base):
    __tablename__ = "finance_entries"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("public.leads.id", ondelete="SET NULL"), nullable=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("public.customers.id", ondelete="SET NULL"), nullable=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("public.products.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("public.finance_categories.id", ondelete="SET NULL"), nullable=True)
    
    type = Column(String, nullable=False) # receita, despesa
    description = Column(String, nullable=False)
    origin = Column(String, default="avulso")
    amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    
    status = Column(String, default="pendente")
    payment_method = Column(String)
    
    installment_number = Column(Integer, default=1)
    total_installments = Column(Integer, default=1)
    
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="finance_entries")
    lead = relationship("Lead", back_populates="finance_entries")
    appointment = relationship("Appointment", back_populates="finance_entries")
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("public.appointments.id", ondelete="SET NULL"), nullable=True)


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="#000000")
    order_index = Column(Integer, default=0, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="pipeline_stages")


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("public.customers.id", ondelete="RESTRICT"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("public.plans.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String, default="pending")
    start_date = Column(Date, nullable=False, server_default=func.current_date())
    next_billing_date = Column(Date)
    cancellation_date = Column(Date)
    price = Column(Numeric(12, 2), nullable=False)
    periodicity = Column(String, default="monthly")
    contract_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="subscriptions")
    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")


class Integration(Base):
    __tablename__ = "integrations"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    credentials = Column(JSON)
    active = Column(Boolean, default=False)
    settings = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="integrations")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    type = Column(String, default="info")
    link_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="notifications")
    user = relationship("User", back_populates="notifications")


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("public.customers.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("public.leads.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    
    # New Service Fields
    # Service/Product Link
    service_id = Column(UUID(as_uuid=True), ForeignKey("public.products.id", ondelete="RESTRICT"), nullable=True)
    service_duration_minutes = Column(Integer, nullable=False, default=30)
    service_value = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Plan Link
    plan_id = Column(UUID(as_uuid=True), ForeignKey("public.plans.id", ondelete="SET NULL"), nullable=True)
    
    # Billing Status: open, covered_by_plan, paid, cancelled
    billing_status = Column(String, default="open")

    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    location = Column(String)
    meeting_link = Column(Text)
    status = Column(String, default="scheduled")
    external_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="appointments")
    customer = relationship("Customer", back_populates="appointments")
    lead = relationship("Lead", back_populates="appointments")
    service = relationship("Product")
    finance_entries = relationship("FinanceEntry", back_populates="appointment")




class Niche(Base):
    __tablename__ = "niches"
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenants = relationship("Tenant", back_populates="niche")
