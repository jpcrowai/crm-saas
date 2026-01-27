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
    sku: str
    name: str
    description: Optional[str] = ""
    price: float
    category: str
    unit: str # monthly, hourly, unit, package
    status: str = "Active" # Active / Inactive
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

def map_legacy_product(p: Dict[str, Any]) -> Dict[str, Any]:
    """Maps Portuguese fields to English fields if necessary."""
    mapped = p.copy()
    
    # Mapping table: format (New Key, [Old Keys])
    mappings = [
        ("sku", ["codigo", "code"]),
        ("name", ["nome", "produto", "servico"]),
        ("description", ["descricao", "obs"]),
        ("price", ["preco_unitario", "valor", "preco"]),
        ("category", ["categoria", "tipo"]),
        ("unit", ["unidade", "medida"]),
        ("status", ["situacao", "ativo"]) # status is usually same, but good to check
    ]
    
    for new_key, old_keys in mappings:
        if new_key not in mapped or not mapped[new_key]:
            for old in old_keys:
                if old in mapped and mapped[old]:
                    mapped[new_key] = mapped[old]
                    # Don't delete old keys to avoid data loss during transition if we write back whole dicts
                    # But for the Pydantic model we just need the new keys populated
                    break
    
    # Defaults
    if "price" not in mapped: mapped["price"] = 0.0
    else: mapped["price"] = clean_price(mapped["price"])
    
    if "status" not in mapped: mapped["status"] = "Active"
    
    return mapped

@router.get("/products", response_model=List[Product])
async def get_products(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    raw_products = read_sheet(current_user.tenant_slug, "products")
    
    cleaned = []
    for p in raw_products:
        # Apply mapping
        p_mapped = map_legacy_product(p)
        
        # Ensure strings
        for key in ["sku", "name", "category", "unit", "status"]:
            if not p_mapped.get(key): p_mapped[key] = ""
            
        cleaned.append(p_mapped)
        
    return cleaned

@router.post("/products", response_model=Product)
async def create_product(product: Product, current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    products = read_sheet(current_user.tenant_slug, "products")
    
    # Check if sku already exists
    # Check both sku and codigo for backward compat check
    if any(p.get("sku") == product.sku or p.get("codigo") == product.sku for p in products):
        raise HTTPException(status_code=400, detail="Product Code (SKU) already exists")
        
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
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields except ID
    if "id" in product_in: del product_in["id"]
    if "price" in product_in:
        product_in["price"] = clean_price(product_in["price"])

    products[idx].update(product_in)
    products[idx]["updated_at"] = datetime.now().isoformat()
    
    write_sheet(current_user.tenant_slug, "products", products)
    
    # Return mapped version just to be safe for response model
    return Product(**map_legacy_product(products[idx]))

@router.get("/products/template")
async def get_product_template(current_user: TokenData = Depends(get_current_tenant_user)):
    ensure_product_sheets(current_user.tenant_slug)
    products = read_sheet(current_user.tenant_slug, "products")
    
    # We want to export a template that works for the NEW format, but maybe populating with old data is nice?
    # Let's map everything to new format first
    mapped_products = [map_legacy_product(p) for p in products]
    
    df = pd.DataFrame(mapped_products)
    if df.empty:
        df = pd.DataFrame(columns=["sku", "name", "description", "price", "category", "unit", "status"])
    else:
        # Reorder and filter columns for the template
        cols = ["sku", "name", "description", "price", "category", "unit", "status"]
        # Ensure cols exist
        for c in cols:
            if c not in df.columns: df[c] = ""
        df = df[cols]
    
    # Map headers to Portuguese for user friendliness
    headers = {
        "sku": "Código",
        "name": "Nome",
        "description": "Descrição",
        "price": "Preço Unitário",
        "category": "Categoria",
        "unit": "Unidade",
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
        raise HTTPException(status_code=400, detail="File must be Excel")
        
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Robust Mapping
        mapping = {
            "sku": ["código", "codigo", "code", "id", "sku"],
            "name": ["nome", "name", "produto", "serviço", "servico"],
            "description": ["descrição", "descricao", "description", "obs"],
            "price": ["preço unitário", "preco unitario", "preço", "valor", "price"],
            "category": ["categoria", "category", "tipo"],
            "unit": ["unidade", "unit", "medida"],
            "status": ["status", "ativo", "situacao"]
        }
        
        def find_col(possible_names):
            for col in df.columns:
                if str(col).lower().strip() in possible_names:
                    return col
            return None

        actual_mapping = {key: find_col(standards) for key, standards in mapping.items()}
        
        if not actual_mapping["sku"]:
            raise HTTPException(status_code=400, detail="Column 'Código' or 'SKU' not found in Excel")

        ensure_product_sheets(current_user.tenant_slug)
        products = read_sheet(current_user.tenant_slug, "products")
        
        stats = {"created": 0, "updated": 0, "errors": 0}
        
        for _, row in df.iterrows():
            try:
                sku = str(row[actual_mapping["sku"]]).strip()
                if not sku or pd.isna(sku): continue
                
                prod_data = {}
                for key, col in actual_mapping.items():
                    if col and pd.notnull(row[col]):
                        val = row[col]
                        if key == "price":
                            val = clean_price(val)
                        prod_data[key] = val
                    else:
                        if key == "status": prod_data[key] = "Active"
                        elif key == "price": prod_data[key] = 0.0
                        else: prod_data[key] = "" # Default empty string
                
                # Check for existing by SKU/Code
                # We check match against 'sku' OR 'codigo' to match existing legacy items
                existing_idx = next((i for i, p in enumerate(products) if str(p.get("sku")) == sku or str(p.get("codigo")) == sku), -1)
                
                if existing_idx != -1:
                    products[existing_idx].update(prod_data)
                    products[existing_idx]["updated_at"] = datetime.now().isoformat()
                    # Ensure we migrate legacy keys if we are updating
                    # If we update, we might as well clean up legacy keys, but keeping them doesn't hurt much if we use the mapper on read
                    # But ideally we standardize on write
                    if "codigo" in products[existing_idx]: del products[existing_idx]["codigo"]
                    if "nome" in products[existing_idx]: del products[existing_idx]["nome"]
                    if "preco_unitario" in products[existing_idx]: del products[existing_idx]["preco_unitario"]
                    
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
            "message": "Product import finished",
            "created": stats["created"],
            "updated": stats["updated"],
            "errors": stats["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
