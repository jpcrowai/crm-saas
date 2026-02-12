from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, master, tenant_users
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base
import app.models.sql_models as sql_models

# Initialize SQL database tables
sql_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM SaaS Multi-tenant")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for logos
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

@app.get("/")
def root():
    return {"message": "CRM SaaS API is running"}
