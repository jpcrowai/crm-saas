from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os
import uuid

router = APIRouter(prefix="/uploads", tags=["uploads"])

if os.environ.get("VERCEL"):
    STATIC_DIR = "/tmp/static"
else:
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STATIC_DIR = os.path.join(BACKEND_DIR, "static")

UPLOAD_DIR = os.path.join(STATIC_DIR, "uploads")

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
            print(f"DEBUG: Attempting upload to Supabase bucket: {storage_service.BUCKET_NAME}")
            public_url = storage_service.upload_file(
                file.file,
                filename,
                "generic", # Folder in bucket
                "uploads"  # Subfolder
            )
            print(f"DEBUG: Supabase upload success: {public_url}")
            return {"url": public_url}
        except Exception as storage_err:
            print(f"ERROR: Supabase Storage failed: {storage_err}")
            
            # 2. Fallback to local /tmp (only works while instance is alive)
            # IMPORTANT: Return a path that starts with /static, let frontend handle the domain
            file_path = os.path.join(UPLOAD_DIR, filename)
            file.file.seek(0) # Reset file pointer after supabase attempt
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            relative_url = f"/static/uploads/{filename}"
            print(f"DEBUG: Falling back to local storage: {relative_url}")
            return {"url": relative_url}

    except Exception as e:
        print(f"Critical error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar imagem")
