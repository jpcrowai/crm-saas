from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Optional
import uuid
import os
import json
import shutil
from app.deps import get_current_master
from app.models.schemas import Environment, TokenData, EnvironmentUpdate
from app.services.excel_service import read_sheet, write_sheet, init_excel_file

from datetime import datetime
from fpdf import FPDF
from fastapi.responses import FileResponse

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
    
    filename = f"contrato_ambiente_{env_data['slug']}.pdf"
    storage_dir = os.path.join("storage", env_data['slug'])
    os.makedirs(storage_dir, exist_ok=True)
    filepath = os.path.join(storage_dir, filename)
    pdf.output(filepath)
    return filepath

@router.get("/ambientes/{slug}/contract")
async def get_environment_contract(slug: str, current_user: TokenData = Depends(get_current_master)):
    ambientes = read_sheet("ambientes", "ambientes")
    env = next((a for a in ambientes if a["slug"] == slug), None)
    
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
            
    # If signed exists, return it, otherwise return generated
    pdf_path = env.get("contract_generated_url")
    download_name = f"contrato_licenciamento_{slug}.pdf"

    if env.get("contract_status") == "signed" and env.get("contract_signed_url"):
        # If user specifically wants the blank one maybe we need another param?
        # But usually 'Download PDF' implies the one to be signed.
        pass

    if not pdf_path or not os.path.exists(pdf_path):
        # Regenerate if missing
        try:
            pdf_path = generate_environment_contract_pdf(env)
            # Update env with path if it was missing logic
            env_idx = next((i for i, a in enumerate(ambientes) if a["slug"] == slug), -1)
            ambientes[env_idx]["contract_generated_url"] = pdf_path
            write_sheet("ambientes", "ambientes", ambientes)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating contract: {str(e)}")
            
    return FileResponse(pdf_path, filename=download_name)

@router.get("/ambientes", response_model=List[Environment])
async def get_ambientes(current_user: TokenData = Depends(get_current_master)):
    ambientes_raw = read_sheet("ambientes", "ambientes")
    valid_ambientes = []
    for a in ambientes_raw:
        try:
            slug = a.get("slug")
            if not slug:
                continue
            
            # Map values ensuring we don't pass None to fields that expect strings/bools/lists
            processed = {
                "id": a.get("id") or str(uuid.uuid4()),
                "slug": slug,
                "nome_empresa": a.get("nome_empresa") or a.get("nome") or "Empresa sem Nome",
                "cnpj": a.get("cnpj") or "",
                "endereco": a.get("endereco") or "",
                "nicho_id": a.get("nicho_id") or a.get("nicho") or "",
                "logo_url": a.get("logo_url"),
                "cor_principal": a.get("cor_principal") or "#d4af37",
                "plan": a.get("plan") or "basic",
                "payment_status": a.get("payment_status") or "trial",
                "contract_generated_url": a.get("contract_generated_url"),
                "contract_signed_url": a.get("contract_signed_url"),
                "contract_status": a.get("contract_status") or "pending_generation",
                "ativo": a.get("ativo") if a.get("ativo") is not None else True, # Default True for legacy compatibility
                "excel_file": a.get("excel_file") or f"{slug}.xlsx",
                "nome": a.get("nome") or a.get("nome_empresa") or "Empresa sem Nome"
            }

            # Handle modulos_habilitados specifically
            mods = a.get("modulos_habilitados")
            if mods is None:
                processed["modulos_habilitados"] = []
            elif isinstance(mods, str):
                try:
                    processed["modulos_habilitados"] = json.loads(mods)
                except:
                    processed["modulos_habilitados"] = []
            else:
                processed["modulos_habilitados"] = mods
            
            valid_ambientes.append(Environment(**processed))
        except Exception as e:
            print(f"Error processing record {a.get('slug')}: {e}")
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
    current_user: TokenData = Depends(get_current_master)
):
    ambientes = read_sheet("ambientes", "ambientes")
    
    if any(a["slug"] == slug for a in ambientes):
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    # Process modulos_habilitados
    mods = ["dashboard", "leads_pipeline", "agenda", "clientes", "equipe", "financeiro", "produtos", "assinaturas"]
    if modulos_habilitados:
        try:
            mods = json.loads(modulos_habilitados)
        except:
            pass

    # Save Logo
    logo_url = ""
    if logo:
        static_dir = os.path.join("static", "logos")
        os.makedirs(static_dir, exist_ok=True)
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(static_dir, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        logo_url = f"/static/logos/{filename}"

    new_id = str(uuid.uuid4())
    excel_filename = f"{slug}.xlsx"
    
    new_env = {
        "id": new_id,
        "slug": slug,
        "nome_empresa": nome_empresa,
        "cnpj": cnpj,
        "endereco": endereco,
        "excel_file": excel_filename,
        "logo_url": logo_url,
        "nicho_id": nicho_id or "",
        "cor_principal": cor_principal,
        "plan": plan,
        "payment_status": "trial",
        "ativo": False, # Pendente de Contrato
        "contract_status": "pending_generation",
        "modulos_habilitados": mods
    }
    
    # Generate Contract PDF (Always generated for record)
    try:
        pdf_path = generate_environment_contract_pdf(new_env)
        new_env["contract_generated_url"] = pdf_path
        new_env["contract_status"] = "generated"
    except Exception as e:
        print(f"Error generating contract: {e}")

    # Handle Signed Contract Upload
    if contract_file:
        static_dir = os.path.join("storage", slug)
        os.makedirs(static_dir, exist_ok=True)
        if contract_file.content_type == "application/pdf":
            filename = f"contrato_assinado_{uuid.uuid4().hex[:6]}.pdf"
            filepath = os.path.join(static_dir, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(contract_file.file, buffer)
            
            new_env["contract_signed_url"] = filepath
            new_env["contract_status"] = "signed"
            # Optional: Auto-activate if signed contract provided?
            # new_env["ativo"] = True 

    # Init tenant excel
    from app.services.auth_service import get_password_hash
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "name": "Admin",
        "role": "admin",
        "password_hash": get_password_hash(admin_password)
    }
    
    lead_columns = ["id", "name", "email", "phone", "status", "value", "created_at"]
    if nicho_id:
        try:
            niches_data = read_sheet("niches", "niches")
            selected_niche = next((n for n in niches_data if str(n.get("id")) == str(nicho_id)), None)
            if selected_niche:
                cols = selected_niche.get("columns") or []
                for c in cols:
                    if c not in lead_columns:
                        lead_columns.append(c)
        except Exception as e:
            print(f"Error loading niche columns: {e}")
    
    init_excel_file(slug, {
        "users": ["id", "email", "name", "role", "password_hash"],
        "leads": lead_columns
    })
    
    write_sheet(slug, "users", [admin_user])
    ambientes.append(new_env)
    write_sheet("ambientes", "ambientes", ambientes)
    
    return Environment(**new_env)

@router.put("/ambientes/{slug}", response_model=Environment)
async def update_ambiente(
    slug: str,
    nome_empresa: Optional[str] = Form(None),
    cnpj: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    nicho_id: Optional[str] = Form(None),
    plan: Optional[str] = Form(None),
    payment_status: Optional[str] = Form(None),
    ativo: Optional[str] = Form(None), # From frontend often sent as string "true"/"false"
    modulos_habilitados: Optional[str] = Form(None), # JSON from frontend
    logo: Optional[UploadFile] = File(None),
    contract_file: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_master)
):
    ambientes = read_sheet("ambientes", "ambientes")
    env_idx = next((i for i, a in enumerate(ambientes) if a["slug"] == slug), -1)
    
    if env_idx == -1:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    env = ambientes[env_idx]
    
    if nome_empresa is not None: env["nome_empresa"] = nome_empresa
    if cnpj is not None: env["cnpj"] = cnpj
    if endereco is not None: env["endereco"] = endereco
    if nicho_id is not None: env["nicho_id"] = nicho_id
    if plan is not None: env["plan"] = plan
    if payment_status is not None: env["payment_status"] = payment_status
    
    if modulos_habilitados is not None:
        try:
            env["modulos_habilitados"] = json.loads(modulos_habilitados)
        except:
            pass
            
    if logo:
        static_dir = os.path.join("static", "logos")
        os.makedirs(static_dir, exist_ok=True)
        file_ext = logo.filename.split(".")[-1]
        filename = f"{slug}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = os.path.join(static_dir, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        env["logo_url"] = f"/static/logos/{filename}"
        
    if contract_file:
        storage_dir = os.path.join("storage", slug)
        os.makedirs(storage_dir, exist_ok=True)
        # Verify it's PDF
        if contract_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos para o contrato.")
            
        filename = f"contrato_assinado_{uuid.uuid4().hex[:6]}.pdf"
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(contract_file.file, buffer)
        
        env["contract_signed_url"] = filepath
        env["contract_status"] = "signed"

    # Status Logic
    if ativo is not None:
        is_active = str(ativo).lower() == 'true'
        if is_active and env.get("contract_status") != "signed":
            # If trying to activate but no signed contract
            raise HTTPException(status_code=400, detail="Não é possível ativar o ambiente sem um contrato assinado.")
        env["ativo"] = is_active

    ambientes[env_idx] = env
    write_sheet("ambientes", "ambientes", ambientes)
    
    return Environment(**env)

@router.delete("/ambientes/{slug}")
async def delete_ambiente(slug: str, current_user: TokenData = Depends(get_current_master)):
    ambientes = read_sheet("ambientes", "ambientes")
    env_idx = next((i for i, a in enumerate(ambientes) if a["slug"] == slug), -1)
    if env_idx == -1: raise HTTPException(status_code=404)
    env = ambientes[env_idx]
    excel_path = os.path.join("data", f"{slug}.xlsx")
    if os.path.exists(excel_path): os.remove(excel_path)
    ambientes.pop(env_idx)
    write_sheet("ambientes", "ambientes", ambientes)
    return {"message": f"Ambiente '{env.get('nome_empresa', slug)}' excluído"}
