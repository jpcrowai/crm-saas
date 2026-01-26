from fastapi import APIRouter, Depends
from typing import List
from app.deps import get_current_tenant_user
from app.models.schemas import User, TokenData
from app.services.excel_service import read_sheet
# read_sheet handles path resolution by filename

router = APIRouter(prefix="/tenant", tags=["tenant"])

@router.get("/users", response_model=list[User])
async def get_tenant_users(current_user: TokenData = Depends(get_current_tenant_user)):
    # read users from tenant excel
    # we know the slug from current_user.tenant_slug
    # The file name is typically slug.xlsx but we should probably look it up from ambientes for robustness
    # OR since we made the file name = slug.xlsx in create_ambiente, we can rely on that convetion for now.
    # To be safer, we could re-read "ambientes.xlsx" or depend on a service function.
    
    # Let's rely on convention for performance/simplicity as requested.
    # But wait, read_sheet takes file_name without extension or with extension.
    # And it assumes it is in backend/excel/ which is correct.
    
    users = read_sheet(current_user.tenant_slug, "users")
    return [User(**u) for u in users]

from app.models.schemas import UserCreate
from app.services.excel_service import write_sheet
from app.services.auth_service import get_password_hash
from fastapi import HTTPException
import uuid

@router.post("/users", response_model=User)
async def create_tenant_user(user_in: UserCreate, current_user: TokenData = Depends(get_current_tenant_user)):
    # Verify if creator is admin
    if current_user.role_local != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    users = read_sheet(current_user.tenant_slug, "users")
    
    if any(u["email"] == user_in.email for u in users):
        raise HTTPException(status_code=400, detail="Email already exists in this team")
        
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_in.email,
        "name": user_in.name,
        "role": "user", # Default role for invited members
        "password_hash": get_password_hash(user_in.password)
    }
    
    users.append(new_user)
    write_sheet(current_user.tenant_slug, "users", users)
    
    return User(**new_user)
