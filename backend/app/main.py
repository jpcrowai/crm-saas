from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, master, tenant_users
from fastapi.staticfiles import StaticFiles
import os

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
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
    os.makedirs(os.path.join(STATIC_DIR, "logos"))

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

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

@app.get("/")
def root():
    return {"message": "CRM SaaS API is running"}
