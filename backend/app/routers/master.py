from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
import uuid
import os
import json
import shutil
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_master
from app.models.schemas import Environment, TokenData, EnvironmentUpdate
from app.models.sql_models import Tenant, User, Niche
from app.services.auth_service import get_password_hash
from app.services import storage_service

from datetime import datetime
from fpdf import FPDF
from fastapi.responses import FileResponse, RedirectResponse

router = APIRouter(prefix="/master", tags=["master"])

def generate_environment_contract_pdf(env_data: dict) -> str:
    pdf = FPDF()
    pdf.add_page()
    
    # --- DECORATIVE WAVES ---
    # Top Wave
    pdf.set_fill_color(15, 23, 42) # Navy 900
    pdf.rect(0, 0, 210, 35, 'F')
    pdf.set_fill_color(212, 175, 55) # Gold
    pdf.rect(0, 33, 210, 2, 'F')

    # --- HEADER ---
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "backend", "static", "crm_icon.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(base_dir, "static", "crm_icon.png")
    
    has_logo = os.path.exists(logo_path)
    if has_logo:
        # Position icon: top-left corner
        pdf.image(logo_path, 10, 7, 15)
    
    pdf.set_y(12)
    pdf.set_font("Arial", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "CONTRATO DE LICENCIAMENTO DE USO", 0, 1, "C")
    
    pdf.set_font("Arial", "", 9)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(0, 5, "SaaS - Software as a Service", 0, 1, "C")

    pdf.ln(20)

    # --- PARTIES ---
    pdf.set_text_color(15, 23, 42)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "1. LICENCIADA (CLIENTE)", 0, 1)

    pdf.set_font("Arial", "", 10)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    pdf.rect(10, pdf.get_y(), 190, 25, 'DF')
    pdf.set_xy(15, pdf.get_y() + 5)
    
    pdf.multi_cell(180, 5, f"Razão Social / Nome: {env_data.get('nome_empresa', '---')}\nCNPJ / CPF: {env_data.get('cnpj', '---')}\nEndereço: {env_data.get('endereco', '---')}")
    pdf.ln(10)

    # --- OBJECT ---
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "2. OBJETO", 0, 1)
    pdf.set_font("Arial", "", 10)
    pdf.multi_cell(0, 6, "O presente contrato tem por objeto o licenciamento de uso do software CRM de forma não exclusiva e intransferível, para gestão de relacionamento com clientes.")
    pdf.ln(5)

    # --- MODULES ---
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "3. MÓDULOS CONTRATADOS", 0, 1)
    pdf.set_font("Arial", "", 10)
    
    modules = env_data.get("modulos_habilitados", [])
    module_names = [m.replace("_", " ").upper() for m in modules]
    
    pdf.set_fill_color(240, 253, 250)
    pdf.rect(10, pdf.get_y(), 190, len(module_names)*8 + 10, 'F')
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_x(15)
    
    for mod in module_names:
        pdf.cell(0, 8, f"- {mod}", 0, 1)
    
    pdf.ln(5)

    # --- AI AGENT CLAUSE ---
    if "ai_agent" in modules:
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(180, 83, 9) # Dark Orange/Amber
        pdf.cell(0, 10, "4. CLÁUSULA ESPECIAL - AGENTE DE IA", 0, 1)
        pdf.set_text_color(15, 23, 42)
        pdf.set_font("Arial", "", 10)
        ai_terms = (
            "4.1. O módulo 'Agente de IA' utiliza modelos de linguagem de terceiros para processar interações.\n"
            "4.2. A LICENCIADA declara estar ciente de que as respostas geradas pela IA são probabilísticas e devem ser supervisionadas.\n"
            "4.3. É vedado o uso do Agente de IA para a geração de conteúdo ilícito, discriminatório ou que viole direitos de terceiros."
        )
        pdf.multi_cell(0, 6, ai_terms)
        pdf.ln(5)

    # --- LGPD ---
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "5. PROTEÇÃO DE DADOS (LGPD)", 0, 1)
    pdf.set_font("Arial", "", 10)
    lgpd_terms = (
        "5.1. As partes comprometem-se a cumprir integralmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n"
        "5.2. A LICENCIADA atua como Controladora dos dados pessoais inseridos no sistema, cabendo à LICENCIANTE o papel de Operadora, limitando-se ao tratamento necessário para a execução do serviço contratado."
    )
    pdf.multi_cell(0, 6, lgpd_terms)

    pdf.ln(20)

    # --- SIGNATURES ---
    pdf.line(20, 250, 90, 250)
    pdf.line(120, 250, 190, 250)
    
    pdf.set_xy(20, 252)
    pdf.set_font("Arial", "B", 8)
    pdf.cell(70, 4, "LICENCIANTE (SISTEMA)", 0, 1, 'C')
    
    pdf.set_xy(120, 252)
    pdf.cell(70, 4, env_data.get('nome_empresa', 'LICENCIADA').upper(), 0, 1, 'C')
    pdf.set_x(120)
    pdf.set_font("Arial", "", 7)
    pdf.cell(70, 4, "Representante Legal", 0, 0, 'C')

    # --- BOTTOM WAVE ---
    pdf.set_y(-25)
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 275, 210, 25, 'F')
    
    # Upload PDF to Supabase Storage
    pdf_content = pdf.output(dest='S')  # Get PDF as bytearray (no need to encode)
    filename = f"contrato_ambiente_{env_data['slug']}.pdf"
    
    try:
        public_url = storage_service.upload_file(
            pdf_content,
            filename,
            env_data['slug'],
            "contratos"
        )
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        # Fallback to local storage
        storage_dir = os.path.join("storage", env_data['slug'])
        os.makedirs(storage_dir, exist_ok=True)
        filepath = os.path.join(storage_dir, filename)
        pdf.output(filepath)
        return filepath

@router.get("/ambientes/{slug}/contract")
async def get_environment_contract(slug: str, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_master)):
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Environment not found")
            
    # If signed exists, return it, otherwise return generated
    pdf_path = tenant.contract_generated_url
    download_name = f"contrato_licenciamento_{slug}.pdf"

    if pdf_path and (pdf_path.startswith("http://") or pdf_path.startswith("https://")):
        return RedirectResponse(url=pdf_path)

    if not pdf_path or not os.path.exists(pdf_path):
        # Regenerate if missing
        try:
            # Map DB model to dict for pdf generator
            env_data = {
                "slug": tenant.slug,
                "nome_empresa": tenant.name,
                "cnpj": tenant.document,
                "endereco": tenant.address,
                "modulos_habilitados": [] # TODO: Store this in DB? For now empty
            }
            pdf_path = generate_environment_contract_pdf(env_data)
            tenant.contract_generated_url = pdf_path
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating contract: {str(e)}")
            
    return FileResponse(pdf_path, filename=download_name)

@router.get("/ambientes", response_model=List[Environment])
async def get_ambientes(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_master)):
    tenants = db.query(Tenant).all()
    valid_ambientes = []
    for t in tenants:
        try:
            processed = {
                "id": str(t.id),
                "slug": t.slug,
                "nome_empresa": t.name,
                "cnpj": t.document or "",
                "endereco": t.address or "",
                "nicho_id": str(t.niche_id) if t.niche_id else "",
                "logo_url": t.logo_url,
                "cor_principal": t.primary_color or "#d4af37",
                "plan": t.plan_tier or "basic",
                "payment_status": t.payment_status or "trial",
                "contract_generated_url": t.contract_generated_url,
                "contract_signed_url": t.contract_signed_url,
                "contract_status": t.contract_status or "pending_generation",
                "ativo": t.active,
                "excel_file": f"{t.slug}.xlsx", # Legacy
                "nome": t.name,
                "modulos_habilitados": t.modulos_habilitados or []
            }
            valid_ambientes.append(Environment(**processed))
        except Exception as e:
            print(f"Error processing tenant {t.slug}: {e}")
            continue
            
    return valid_ambientes

@router.post("/ambientes", response_model=Environment)
async def create_ambiente(
    nome_empresa: str = Form(...),
    slug: str = Form(...),
    cnpj: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    admin_email: str = Form(...),
    admin_password: str = Form(...),
    nicho_id: Optional[str] = Form(None),
    cor_principal: Optional[str] = Form("#0055FF"),
    plan: Optional[str] = Form("basic"),
    modulos_habilitados: Optional[str] = Form(None), # JSON string from frontend
    logo: Optional[UploadFile] = File(None),
    contract_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_master)
):
    if db.query(Tenant).filter(Tenant.slug == slug).first():
        raise HTTPException(status_code=400, detail=f"O slug '{slug}' já está em uso por outro ambiente.")

    if db.query(User).filter(User.email == admin_email).first():
        raise HTTPException(status_code=400, detail=f"O e-mail '{admin_email}' já está cadastrado no sistema.")

    # Save Logo to Supabase Storage
    logo_url = ""
    if logo:
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        
        try:
            logo_url = storage_service.upload_file(
                logo.file,
                filename,
                slug,
                "logos"
            )
        except Exception as e:
            print(f"Error uploading logo: {e}")
            # Fallback to local
            if os.environ.get("VERCEL"):
                static_dir = os.path.join("/tmp/static", "logos")
            else:
                static_dir = os.path.join("static", "logos")
                
            os.makedirs(static_dir, exist_ok=True)
            filepath = os.path.join(static_dir, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            logo_url = f"/static/logos/{filename}"

    # Generate deterministic UUID from slug
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8') # DNS Namespace
    tenant_id = uuid.uuid5(namespace, slug)

    new_tenant = Tenant(
        id=tenant_id,
        slug=slug,
        name=nome_empresa,
        document=cnpj,
        address=endereco,
        logo_url=logo_url,
        niche_id=nicho_id if nicho_id else None,
        primary_color=cor_principal,
        plan_tier=plan,
        payment_status="trial",
        active=False, # Pendente de contrato
        contract_status="pending_generation",
        modulos_habilitados=json.loads(modulos_habilitados) if modulos_habilitados else []
    )
    db.add(new_tenant)
    db.flush() # get ID

    # Generate Contract
    try:
        env_data = {
            "slug": slug,
            "nome_empresa": nome_empresa,
            "cnpj": cnpj,
            "endereco": endereco,
            "modulos_habilitados": json.loads(modulos_habilitados) if modulos_habilitados else []
        }
        pdf_path = generate_environment_contract_pdf(env_data)
        new_tenant.contract_generated_url = pdf_path
        new_tenant.contract_status = "generated"
    except Exception as e:
        print(f"Error generating contract: {e}")

    # Handle Signed Contract - Upload to Supabase Storage
    if contract_file:
        filename = f"contrato_assinado_{uuid.uuid4().hex[:6]}.pdf"
        try:
            signed_url = storage_service.upload_file(
                contract_file.file,
                filename,
                slug,
                "contratos_assinados"
            )
            new_tenant.contract_signed_url = signed_url
            new_tenant.contract_status = "signed"
        except Exception as e:
            print(f"Error uploading signed contract: {e}")
            # Fallback to local
            if os.environ.get("VERCEL"):
                storage_dir = os.path.join("/tmp/storage", slug)
                os.makedirs("/tmp/storage", exist_ok=True)
            else:
                storage_dir = os.path.join("storage", slug)
                
            os.makedirs(storage_dir, exist_ok=True)
            filepath = os.path.join(storage_dir, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(contract_file.file, buffer)
            new_tenant.contract_signed_url = filepath
            new_tenant.contract_status = "signed"

    # Create Admin User
    admin_user = User(
        email=admin_email,
        name="Admin",
        role="admin",
        password_hash=get_password_hash(admin_password),
        tenant_id=new_tenant.id
    )
    db.add(admin_user)
    
    db.commit()
    db.refresh(new_tenant)
    
    return Environment(
        id=str(new_tenant.id),
        slug=new_tenant.slug,
        nome_empresa=new_tenant.name,
        cnpj=new_tenant.document or "",
        endereco=new_tenant.address or "",
        nicho_id=str(new_tenant.niche_id) if new_tenant.niche_id else "",
        logo_url=new_tenant.logo_url,
        ativo=new_tenant.active,
        modulos_habilitados=json.loads(modulos_habilitados) if modulos_habilitados else []
    )

@router.put("/ambientes/{slug}", response_model=Environment)
async def update_ambiente(
    slug: str,
    nome_empresa: Optional[str] = Form(None),
    cnpj: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    nicho_id: Optional[str] = Form(None),
    plan: Optional[str] = Form(None),
    payment_status: Optional[str] = Form(None),
    ativo: Optional[str] = Form(None),
    modulos_habilitados: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    contract_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_master)
):
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    if nome_empresa is not None: tenant.name = nome_empresa
    if cnpj is not None: tenant.document = cnpj
    if endereco is not None: tenant.address = endereco
    if nicho_id is not None: tenant.niche_id = nicho_id
    if plan is not None: tenant.plan_tier = plan
    if payment_status is not None: tenant.payment_status = payment_status
    if modulos_habilitados is not None:
        tenant.modulos_habilitados = json.loads(modulos_habilitados)
    
    if logo:
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        
        try:
            logo_url = storage_service.upload_file(
                logo.file,
                filename,
                slug,
                "logos"
            )
            tenant.logo_url = logo_url
        except Exception as e:
            print(f"Error uploading logo: {e}")
            # Fallback
            if os.environ.get("VERCEL"):
                static_dir = os.path.join("/tmp/static", "logos")
            else:
                static_dir = os.path.join("static", "logos")
                
            os.makedirs(static_dir, exist_ok=True)
            filepath = os.path.join(static_dir, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            tenant.logo_url = f"/static/logos/{filename}"
            print(f"DEBUG: Logo updated locally at {tenant.logo_url}")
        
    if contract_file:
        if contract_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos para o contrato.")
        
        filename = f"contrato_assinado_{uuid.uuid4().hex[:6]}.pdf"
        try:
            signed_url = storage_service.upload_file(
                contract_file.file,
                filename,
                slug,
                "contratos_assinados"
            )
            tenant.contract_signed_url = signed_url
            tenant.contract_status = "signed"
        except Exception as e:
            print(f"Error uploading signed contract: {e}")
            # Fallback
            if os.environ.get("VERCEL"):
                storage_dir = os.path.join("/tmp/storage", slug)
                os.makedirs("/tmp/storage", exist_ok=True)
            else:
                storage_dir = os.path.join("storage", slug)
                
            os.makedirs(storage_dir, exist_ok=True)
            filepath = os.path.join(storage_dir, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(contract_file.file, buffer)
            tenant.contract_signed_url = filepath
            tenant.contract_status = "signed"

    if ativo is not None:
        is_active = str(ativo).lower() == 'true'
        if is_active and tenant.contract_status != "signed":
            raise HTTPException(status_code=400, detail="Não é possível ativar o ambiente sem um contrato assinado.")
        tenant.active = is_active

    db.commit()
    db.refresh(tenant)
    
    return Environment(
        id=str(tenant.id),
        slug=tenant.slug,
        nome_empresa=tenant.name,
        cnpj=tenant.document or "",
        endereco=tenant.address or "",
        nicho_id=str(tenant.niche_id) if tenant.niche_id else "",
        logo_url=tenant.logo_url,
        ativo=tenant.active,
        modulos_habilitados=json.loads(modulos_habilitados) if modulos_habilitados else []
    )

@router.delete("/ambientes/{slug}")
async def delete_ambiente(slug: str, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_master)):
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    db.delete(tenant)
    db.commit()
    return {"message": f"Ambiente '{tenant.name}' excluído"}
