from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from app.models.schemas import Niche, NicheCreate
from app.models.sql_models import Niche as NicheModel
from app.database import get_db
from app.deps import get_current_master

router = APIRouter(prefix="/niches", tags=["niches"])

@router.get("/", response_model=List[Niche])
async def get_niches(db: Session = Depends(get_db)):
    return db.query(NicheModel).all()

@router.post("/", response_model=Niche)
async def create_niche(niche_in: NicheCreate, db: Session = Depends(get_db), current_user = Depends(get_current_master)):
    if db.query(NicheModel).filter(NicheModel.name.ilike(niche_in.name)).first():
        raise HTTPException(status_code=400, detail="Niche name already exists")
    
    new_niche = NicheModel(
        name=niche_in.name,
        description=niche_in.description
    )
    db.add(new_niche)
    db.commit()
    db.refresh(new_niche)
    return new_niche

@router.put("/{niche_id}", response_model=Niche)
async def update_niche(niche_id: str, niche_in: NicheCreate, db: Session = Depends(get_db), current_user = Depends(get_current_master)):
    db_niche = db.query(NicheModel).filter(NicheModel.id == niche_id).first()
    if not db_niche:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    db_niche.name = niche_in.name
    db_niche.description = niche_in.description
    
    db.commit()
    db.refresh(db_niche)
    return db_niche

@router.delete("/{niche_id}")
async def delete_niche(niche_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_master)):
    db_niche = db.query(NicheModel).filter(NicheModel.id == niche_id).first()
    if not db_niche:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    db.delete(db_niche)
    db.commit()
    return {"message": "Niche deleted successfully"}
