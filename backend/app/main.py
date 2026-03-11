from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, master, tenant_users
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base
import app.models.sql_models as sql_models

from sqlalchemy import text

# Database initialization moved to startup event for better resilience on serverless
def run_migrations(conn):
    """Ensure missing columns are added to existing tables without breaking data."""
    print("🚀 Running automatic schema migrations...")
    
    migrations = [
        # Finance Entries migrations
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS supplier_id UUID;",
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS appointment_id UUID;",
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS subscription_id UUID;",
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS service_id UUID;",
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;",
        "ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;",
        
        # Leads CRM migrations
        "ALTER TABLE public.leads_crm ADD COLUMN IF NOT EXISTS origin VARCHAR;",
        "ALTER TABLE public.leads_crm ADD COLUMN IF NOT EXISTS observations TEXT;",
        "ALTER TABLE public.leads_crm ADD COLUMN IF NOT EXISTS responsible_user VARCHAR;"
    ]
    
    for sql in migrations:
        try:
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            print(f"⚠️ Migration note: {sql} -> {e}")

def init_db():
    try:
        # 1. Create tables that don't exist
        sql_models.Base.metadata.create_all(bind=engine)
        
        # 2. Run migrations for existing tables columns
        with engine.connect() as conn:
            run_migrations(conn)
            
        print("✅ Database tables and schema verified/migrated")
    except Exception as e:
        print(f"CRITICAL: Could not connect to database: {e}")

app = FastAPI(title="CRM SaaS Multi-tenant")

# Diagnostic Middleware to catch 500s and return them with CORS headers
@app.middleware("http")
async def db_session_middleware(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        import traceback
        error_details = traceback.format_exc()
        print(f"RUNTIME ERROR: {error_details}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error", 
                "error": str(exc),
                "traceback": error_details
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )

@app.on_event("startup")
async def startup_event():
    init_db()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for logos
# Static files for logos - Use /tmp on Vercel for write access
if os.environ.get("VERCEL"):
    STATIC_DIR = "/tmp/static"
else:
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
LOGO_DIR = os.path.join(STATIC_DIR, "logos")

try:
    if not os.path.exists(STATIC_DIR):
        os.makedirs(STATIC_DIR, exist_ok=True)
    if not os.path.exists(LOGO_DIR):
        os.makedirs(LOGO_DIR, exist_ok=True)
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
except Exception as e:
    print(f"WARNING: Could not initialize static directory: {e}")
    # In some serverless environments, internal writes might be restricted
    pass

app.include_router(auth.router)
app.include_router(master.router)
app.include_router(tenant_users.router)
from app.routers import tenant_data
app.include_router(tenant_data.router)
from app.routers import niches
app.include_router(niches.router)
from app.routers import appointments
app.include_router(appointments.router)
from app.routers import finances
app.include_router(finances.router)
from app.routers import products
app.include_router(products.router)
from app.routers import subscriptions
app.include_router(subscriptions.router)
from app.routers import services
app.include_router(services.router)
from app.routers import professionals
app.include_router(professionals.router)
from app.routers import suppliers
app.include_router(suppliers.router)
from app.routers import uploads
app.include_router(uploads.router)
from app.routers import financial_reports
app.include_router(financial_reports.router)
from app.routers import commissions
app.include_router(commissions.router)
from app.routers import ai_insights
app.include_router(ai_insights.router)
from app.routers import bot
app.include_router(bot.router)
from app.routers import automations
app.include_router(automations.router)
from app.routers import notifications
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"message": "CRM SaaS API is running"}
