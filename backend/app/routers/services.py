from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models.schemas import TokenData, Service as ServiceSchema, ServiceCreate
from app.models.sql_models import Product as SQLProduct

router = APIRouter(prefix="/tenant/services", tags=["services"])

@router.get("/", response_model=List[ServiceSchema])
async def get_services(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # Fetch products where SKU starts with 'S' (case insensitive)
    # AND where active is true
    products = db.query(SQLProduct).filter(
        SQLProduct.tenant_id == current_user.tenant_id,
        SQLProduct.active == True,
        SQLProduct.type == "service"
    ).all()
    
    # Map Product -> ServiceSchema
    # ServiceSchema expects: id, name, description, duration_minutes, value, primary_color, active
    # Product has: id, name, description, duration_minutes, price, (no primary_color), active, sku
    
    services = []
    for p in products:
        services.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "duration_minutes": p.duration_minutes or 30,
            "value": p.price or 0.0,
            "primary_color": "#0055FF", # Default or maybe store in settings?
            "active": p.active,
            "tenant_id": p.tenant_id,
            "created_at": p.created_at,
            "updated_at": p.created_at # approximation
        })
        
    return services

@router.post("/", response_model=ServiceSchema)
async def create_service(
    service_in: ServiceCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    # When creating via this endpoint, we create a Product with 'S' SKU prefix if not present?
    # Or just create a Product. The user said "Services... are products starting with S".
    # So if we create here, we should ensure SKU starts with S.
    
    # Generate SKU if not provided?
    # ServiceCreate schema might not have SKU.
    # We'll generate one: S-RANDOM
    
    import random
    import string
    sku = f"S-{ ''.join(random.choices(string.ascii_uppercase + string.digits, k=6)) }"
    
    new_product = SQLProduct(
        tenant_id=current_user.tenant_id,
        name=service_in.name,
        description=service_in.description,
        duration_minutes=service_in.duration_minutes,
        price=service_in.value,
        sku=sku,
        type="service",
        active=service_in.active
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Return as ServiceSchema dict
    return {
        "id": new_product.id,
        "name": new_product.name,
        "description": new_product.description,
        "duration_minutes": new_product.duration_minutes,
        "value": new_product.price,
        "primary_color": "#0055FF",
        "active": new_product.active,
        "tenant_id": new_product.tenant_id,
        "created_at": new_product.created_at,
        "updated_at": new_product.created_at
    }

# Update and Delete endpoints should also target SQLProduct
@router.put("/{service_id}", response_model=ServiceSchema)
async def update_service(
    service_id: str,
    service_in: ServiceCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    product = db.query(SQLProduct).filter(
        SQLProduct.id == service_id,
        SQLProduct.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
    product.name = service_in.name
    product.description = service_in.description
    product.duration_minutes = service_in.duration_minutes
    product.price = service_in.value
    product.active = service_in.active
    
    db.commit()
    db.refresh(product)
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "duration_minutes": product.duration_minutes,
        "value": product.price,
        "primary_color": "#0055FF",
        "active": product.active,
        "tenant_id": product.tenant_id,
        "created_at": product.created_at,
        "updated_at": product.created_at
    }

@router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    product = db.query(SQLProduct).filter(
        SQLProduct.id == service_id,
        SQLProduct.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
    product.active = False
    db.commit()
    return {"message": "Serviço deletado (arquivado)"}
