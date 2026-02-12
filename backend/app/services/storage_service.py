import os
from typing import Optional, BinaryIO
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
# Prioritize the secret service key for administrative storage operations
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY_SECRET") or os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = os.getenv("SUPABASE_BUCKET_NAME", "crm-files")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"WARNING: Supabase configuration missing. URL: {'SET' if SUPABASE_URL else 'MISSING'}, KEY: {'SET' if SUPABASE_KEY else 'MISSING'}")
    supabase: Optional[Client] = None
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("DEBUG: Supabase client initialized successfully")
    except Exception as e:
        print(f"ERROR: Failed to initialize Supabase client: {e}")
        supabase = None


def upload_file(
    file_content: BinaryIO,
    filename: str,
    tenant_slug: str,
    file_type: str = "general"
) -> str:
    """
    Upload a file to Supabase Storage.
    
    Args:
        file_content: File object or bytes
        filename: Name of the file
        tenant_slug: Tenant identifier for organization
        file_type: Type of file (logos, contratos, contratos_assinados, general)
        
    Returns:
        Public URL of the uploaded file
    """
    if not supabase:
        raise Exception("Supabase client not initialized. Check your environment variables.")
    
    # Build path: tenant_slug/file_type/filename
    file_path = f"{tenant_slug}/{file_type}/{filename}"
    
    # Read file content if it's a file object
    if hasattr(file_content, 'read'):
        content = file_content.read()
        file_content.seek(0)  # Reset pointer for potential reuse
    else:
        content = file_content
    
    # Upload to Supabase Storage
    response = supabase.storage.from_(BUCKET_NAME).upload(
        file_path,
        content,
        file_options={"content-type": _get_content_type(filename)}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
    
    return public_url


def get_file_url(file_path: str) -> str:
    """
    Get public URL for a file in Supabase Storage.
    
    Args:
        file_path: Path to the file in storage (e.g., "tenant-slug/logos/logo.png")
        
    Returns:
        Public URL of the file
    """
    if not supabase:
        raise Exception("Supabase client not initialized. Check your environment variables.")
    
    return supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)


def delete_file(file_path: str) -> bool:
    """
    Delete a file from Supabase Storage.
    
    Args:
        file_path: Path to the file in storage
        
    Returns:
        True if successful
    """
    if not supabase:
        raise Exception("Supabase client not initialized. Check your environment variables.")
    
    supabase.storage.from_(BUCKET_NAME).remove([file_path])
    return True


def _get_content_type(filename: str) -> str:
    """Get content type based on file extension."""
    ext = filename.lower().split('.')[-1]
    
    content_types = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    }
    
    return content_types.get(ext, 'application/octet-stream')
