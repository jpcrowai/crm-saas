from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os
import uuid

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Handle Read-only filesystem on Vercel by using /tmp for temporary uploads
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR = os.path.join(BACKEND_DIR, "static", "uploads")

try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create upload directory {UPLOAD_DIR}: {e}")

from app.services import storage_service

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            raise HTTPException(status_code=400, detail="Apenas imagens são permitidas (.jpg, .png, .gif, .webp)")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}{ext}"
        
        # 1. Try Supabase Storage first (Professional way)
        try:
            public_url = storage_service.upload_file(
                file.file,
                filename,
                "generic", # Folder in bucket
                "uploads"  # Subfolder
            )
            return {"url": public_url}
        except Exception as storage_err:
            print(f"Supabase Storage failed, falling back: {storage_err}")
            
            # 2. Fallback to local /tmp (only works while instance is alive)
            file_path = os.path.join(UPLOAD_DIR, filename)
            file.file.seek(0) # Reset file pointer after supabase attempt
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            return {"url": f"/static/uploads/{filename}"}

    except Exception as e:
        print(f"Critical error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar imagem")
