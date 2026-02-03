from app.database import SessionLocal
from app.models.sql_models import Niche as NicheModel
from app.models.schemas import Niche
from typing import List
import json

def debug_niches():
    db = SessionLocal()
    try:
        niches = db.query(NicheModel).all()
        print(f"Found {len(niches)} niches in database.")
        
        valid_niches = []
        for n in niches:
            print(f"Processing niche: {n.name}")
            try:
                # Pydantic v2 from_attributes=True is used in FastAPI
                # Let's try to validate the object directly
                # However, since Niche (schema) has 'ativo: bool = True'
                # but NicheModel (SQL) lacks 'ativo', let's see if it fails.
                
                # In FastAPI, this is done via response_model
                # Let's simulate that
                from pydantic import TypeAdapter
                adapter = TypeAdapter(Niche)
                validated = adapter.validate_python(n, from_attributes=True)
                valid_niches.append(validated)
                print(f"Successfully validated {n.name}")
            except Exception as e:
                print(f"Validation Error for {n.name}: {e}")
        
        print(f"Total valid niches: {len(valid_niches)}")
        if valid_niches:
            print("First item sample:")
            print(json.dumps(valid_niches[0].model_dump(), indent=2, default=str))

    finally:
        db.close()

if __name__ == "__main__":
    debug_niches()
