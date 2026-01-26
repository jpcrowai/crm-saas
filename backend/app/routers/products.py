from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import pandas as pd
from io import BytesIO
from datetime import datetime
from pydantic import BaseModel
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.services.excel_service import read_sheet, write_sheet

router = APIRouter(prefix="/tenant", tags=["products"])

class Product(BaseModel):
    id: Optional[str] = None
    codigo: str
    nome: str
    descricao: Optional[str] = ""
    preco_unitario: float
    categoria: str
    unidade: str # mensal, hora, unidade, pacote
    status: str = "Ativo" # Ativo / Inativo
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

def ensure_product_sheets(tenant_slug: str):
    try:
        read_sheet(tenant_slug, "products")
    except:
        write_sheet(tenant_slug, "products", [])

def clean_price(val):
    if val is None or pd.isna(val): return 0.0
    if isinstance(val, (int, float)): return float(val)
    if isinstance(val, str):
        # Remove R$, dots (thousands), and replace comma with dot
        clean = val.replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        try:
            return float(clean)
        except:
            return 0.0
    return 0.0

@router.get("/products", response_model=List[Product])
async def get_products(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    raw_products = read_sheet(current_user.tenant_slug, "products")
    
    # Process types to ensure Pydantic doesn't fail
    cleaned = []
    for p in raw_products:
        p["preco_unitario"] = clean_price(p.get("preco_unitario"))
        # Ensure other strings are not None
        for key in ["codigo", "nome", "categoria", "unidade", "status"]:
            if not p.get(key): p[key] = ""
        cleaned.append(p)
        
    return cleaned

@router.post("/products", response_model=Product)
async def create_product(product: Product, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    products = read_sheet(current_user.tenant_slug, "products")
    
    # Check if code already exists
    if any(p.get("codigo") == product.codigo for p in products):
        raise HTTPException(status_code=400, detail="Código de produto já existe")
        
    new_product = product.dict()
    new_product["id"] = str(uuid.uuid4())
    new_product["created_at"] = datetime.now().isoformat()
    new_product["updated_at"] = datetime.now().isoformat()
    
    products.append(new_product)
    write_sheet(current_user.tenant_slug, "products", products)
    return Product(**new_product)

@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_in: Dict[str, Any], current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    products = read_sheet(current_user.tenant_slug, "products")
    idx = next((i for i, p in enumerate(products) if p.get("id") == product_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Update fields except ID
    if "id" in product_in: del product_in["id"]
    if "preco_unitario" in product_in:
        product_in["preco_unitario"] = clean_price(product_in["preco_unitario"])

    products[idx].update(product_in)
    products[idx]["updated_at"] = datetime.now().isoformat()
    
    write_sheet(current_user.tenant_slug, "products", products)
    return Product(**products[idx])

@router.get("/products/template")
async def get_product_template(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    products = read_sheet(current_user.tenant_slug, "products")
    
    df = pd.DataFrame(products)
    if df.empty:
        df = pd.DataFrame(columns=["codigo", "nome", "descricao", "preco_unitario", "categoria", "unidade", "status"])
    else:
        # Reorder and filter columns for the template
        cols = ["codigo", "nome", "descricao", "preco_unitario", "categoria", "unidade", "status"]
        df = df[cols]
    
    # Map headers to Portuguese for user friendliness
    headers = {
        "codigo": "Código",
        "nome": "Nome",
        "descricao": "Descrição",
        "preco_unitario": "Preço Unitário",
        "categoria": "Categoria",
        "unidade": "Unidade",
        "status": "Status"
    }
    df.rename(columns=headers, inplace=True)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Produtos')
    output.seek(0)
    
    filename = f"modelo_produtos_{current_user.tenant_slug}.xlsx"
    with open(filename, "wb") as f:
        f.write(output.read())
        
    return FileResponse(filename, filename=filename, background=None)

@router.post("/products/import")
async def import_products(file: UploadFile = File(...), current_user: TokenData = Depends(get_current_tenant_user)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel")
        
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Mapeamento robusto
        mapping = {
            "codigo": ["código", "codigo", "code", "id"],
            "nome": ["nome", "name", "produto", "serviço"],
            "descricao": ["descrição", "descricao", "description", "obs"],
            "preco_unitario": ["preço unitário", "preco unitario", "preço", "valor", "price"],
            "categoria": ["categoria", "category", "tipo"],
            "unidade": ["unidade", "unit", "medida"],
            "status": ["status", "ativo"]
        }
        
        def find_col(possible_names):
            for col in df.columns:
                if str(col).lower().strip() in possible_names:
                    return col
            return None

        actual_mapping = {custom: find_col(standards) for custom, standards in mapping.items()}
        
        if not actual_mapping["codigo"]:
            raise HTTPException(status_code=400, detail="Coluna 'Código' não encontrada no Excel")

        ensure_product_sheets(current_user.tenant_slug)
        products = read_sheet(current_user.tenant_slug, "products")
        
        stats = {"created": 0, "updated": 0, "errors": 0}
        
        for _, row in df.iterrows():
            try:
                codigo = str(row[actual_mapping["codigo"]]).strip()
                if not codigo or pd.isna(codigo): continue
                
                prod_data = {}
                for key, col in actual_mapping.items():
                    if col and pd.notnull(row[col]):
                        val = row[col]
                        if key == "preco_unitario":
                            val = clean_price(val)
                        prod_data[key] = val
                    else:
                        if key == "status": prod_data[key] = "Ativo"
                        elif key == "preco_unitario": prod_data[key] = 0.0
                        else: prod_data[key] = ""
                
                # Check for existing by Code
                existing_idx = next((i for i, p in enumerate(products) if str(p.get("codigo")) == codigo), -1)
                
                if existing_idx != -1:
                    products[existing_idx].update(prod_data)
                    products[existing_idx]["updated_at"] = datetime.now().isoformat()
                    stats["updated"] += 1
                else:
                    new_id = str(uuid.uuid4())
                    new_prod = {
                        "id": new_id, 
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    new_prod.update(prod_data)
                    products.append(new_prod)
                    stats["created"] += 1
            except Exception as e:
                print(f"Error importing row: {e}")
                stats["errors"] += 1
                
        write_sheet(current_user.tenant_slug, "products", products)
        
        return {
            "message": "Importação de produtos concluída",
            "created": stats["created"],
            "updated": stats["updated"],
            "errors": stats["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
