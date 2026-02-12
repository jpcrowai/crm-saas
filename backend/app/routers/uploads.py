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

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            raise HTTPException(status_code=400, detail="Apenas imagens são permitidas (.jpg, .png, .gif, .webp)")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL (Assuming standard mount at /static)
        # We need to construct the full URL or relative URL. usually frontend handles the domain.
        # But let's return the full relative path from root. 
        # Since app.mount("/static", ...) is at root, the url is /static/uploads/filename
        
        return {"url": f"/static/uploads/{filename}"}

    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Erro ao fazer upload da imagem")
