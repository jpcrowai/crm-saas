from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.deps import get_current_tenant_user
from app.models import schemas
from app.models.schemas import TokenData
from app.models.sql_models import Professional

router = APIRouter(prefix="/tenant/professionals", tags=["professionals"])

@router.get("/", response_model=List[schemas.Professional])
def get_professionals(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Lista todos os profissionais do tenant"""
    professionals = db.query(Professional).filter(
        Professional.tenant_id == current_user.tenant_id
    ).order_by(Professional.name).all()
    return professionals

@router.get("/{professional_id}", response_model=schemas.Professional)
def get_professional(
    professional_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Busca um profissional específico"""
    professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.tenant_id == current_user.tenant_id
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    
    return professional

@router.post("/", response_model=schemas.Professional)
def create_professional(
    professional: schemas.ProfessionalCreate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Cria um novo profissional"""
    db_professional = Professional(
        **professional.model_dump(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_professional)
    db.commit()
    db.refresh(db_professional)
    return db_professional

@router.put("/{professional_id}", response_model=schemas.Professional)
def update_professional(
    professional_id: str,
    professional: schemas.ProfessionalUpdate,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Atualiza um profissional"""
    db_professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    
    update_data = professional.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_professional, field, value)
    
    db.commit()
    db.refresh(db_professional)
    return db_professional

@router.delete("/{professional_id}")
def delete_professional(
    professional_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Remove um profissional"""
    db_professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    
    db.delete(db_professional)
    db.commit()
    return {"message": "Profissional removido com sucesso"}
