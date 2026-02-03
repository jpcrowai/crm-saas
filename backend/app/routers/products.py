from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import pandas as pd
from io import BytesIO
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData
from app.models.sql_models import Product as SQLProduct

router = APIRouter(prefix="/tenant", tags=["products"])

class Product(BaseModel):
    id: Optional[str] = None
    sku: str
    name: str
    description: Optional[str] = ""
    price: float
    category: str = ""
    unit: str = "unit"  # monthly, hourly, unit, package
    status: str = "Active"  # Active / Inactive
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


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
async def get_products(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    products = db.query(SQLProduct).filter(
        SQLProduct.tenant_id == current_user.tenant_id
    ).all()
    
    result = []
    for p in products:
        result.append({
            "id": str(p.id),
            "sku": p.name[:20],  # Using name as SKU for now (legacy compatibility)
            "name": p.name,
            "description": p.description or "",
            "price": float(p.price),
            "category": "",  # Not in SQL model
            "unit": "unit",  # Not in SQL model
            "status": "Active" if p.active else "Inactive",
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    
    return result


@router.post("/products", response_model=Product)
async def create_product(
    product: Product,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # Check if product with same name exists
    existing = db.query(SQLProduct).filter(
        SQLProduct.tenant_id == current_user.tenant_id,
        SQLProduct.name == product.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    new_product = SQLProduct(
        tenant_id=current_user.tenant_id,
        name=product.name,
        description=product.description,
        price=product.price,
        active=(product.status == "Active")
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return Product(
        id=str(new_product.id),
        sku=product.sku,
        name=new_product.name,
        description=new_product.description or "",
        price=float(new_product.price),
        category=product.category,
        unit=product.unit,
        status="Active" if new_product.active else "Inactive",
        created_at=new_product.created_at.isoformat()
    )


@router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_in: Dict[str, Any],
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    product = db.query(SQLProduct).filter(
        SQLProduct.id == product_id,
        SQLProduct.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    if "name" in product_in:
        product.name = product_in["name"]
    if "description" in product_in:
        product.description = product_in["description"]
    if "price" in product_in:
        product.price = clean_price(product_in["price"])
    if "status" in product_in:
        product.active = (product_in["status"] == "Active")
    
    db.commit()
    db.refresh(product)
    
    return Product(
        id=str(product.id),
        sku=product_in.get("sku", product.name[:20]),
        name=product.name,
        description=product.description or "",
        price=float(product.price),
        category=product_in.get("category", ""),
        unit=product_in.get("unit", "unit"),
        status="Active" if product.active else "Inactive",
        created_at=product.created_at.isoformat()
    )


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    product = db.query(SQLProduct).filter(
        SQLProduct.id == product_id,
        SQLProduct.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}


@router.get("/products/template")
async def get_product_template(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    products = db.query(SQLProduct).filter(
        SQLProduct.tenant_id == current_user.tenant_id
    ).all()
    
    data = []
    for p in products:
        data.append({
            "Código": p.name[:20],
            "Nome": p.name,
            "Descrição": p.description or "",
            "Preço Unitário": float(p.price),
            "Categoria": "",
            "Unidade": "unit",
            "Status": "Active" if p.active else "Inactive"
        })
    
    df = pd.DataFrame(data)
    if df.empty:
        df = pd.DataFrame(columns=["Código", "Nome", "Descrição", "Preço Unitário", "Categoria", "Unidade", "Status"])
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Produtos')
    output.seek(0)
    
    filename = f"modelo_produtos_{current_user.tenant_slug}.xlsx"
    with open(filename, "wb") as f:
        f.write(output.read())
        
    return FileResponse(filename, filename=filename, background=None)


@router.post("/products/import")
async def import_products(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
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
            "status": ["status", "ativo", "situacao"]
        }
        
        def find_col(possible_names):
            for col in df.columns:
                if str(col).lower().strip() in possible_names:
                    return col
            return None

        actual_mapping = {key: find_col(standards) for key, standards in mapping.items()}
        
        if not actual_mapping["name"] and not actual_mapping["sku"]:
            raise HTTPException(status_code=400, detail="Column 'Nome' or 'Código' not found in Excel")

        stats = {"created": 0, "updated": 0, "errors": 0}
        
        for _, row in df.iterrows():
            try:
                name = str(row[actual_mapping["name"]] if actual_mapping["name"] else row[actual_mapping["sku"]]).strip()
                if not name or pd.isna(name): continue
                
                # Check if product exists
                existing = db.query(SQLProduct).filter(
                    SQLProduct.tenant_id == current_user.tenant_id,
                    SQLProduct.name == name
                ).first()
                
                price = 0.0
                if actual_mapping["price"] and pd.notnull(row[actual_mapping["price"]]):
                    price = clean_price(row[actual_mapping["price"]])
                
                description = ""
                if actual_mapping["description"] and pd.notnull(row[actual_mapping["description"]]):
                    description = str(row[actual_mapping["description"]])
                
                active = True
                if actual_mapping["status"] and pd.notnull(row[actual_mapping["status"]]):
                    status_val = str(row[actual_mapping["status"]]).lower()
                    active = status_val in ["active", "ativo", "ativa", "sim", "yes", "true", "1"]
                
                if existing:
                    existing.description = description
                    existing.price = price
                    existing.active = active
                    stats["updated"] += 1
                else:
                    new_product = SQLProduct(
                        tenant_id=current_user.tenant_id,
                        name=name,
                        description=description,
                        price=price,
                        active=active
                    )
                    db.add(new_product)
                    stats["created"] += 1
                    
            except Exception as e:
                print(f"Error importing row: {e}")
                stats["errors"] += 1
                
        db.commit()
        
        return {
            "message": "Product import finished",
            "created": stats["created"],
            "updated": stats["updated"],
            "errors": stats["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
