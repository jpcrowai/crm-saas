from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.services.auth_service import SECRET_KEY, ALGORITHM
from app.models.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login-master") # Generic URL, might need adjustment

async def get_current_user_token_data(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        role_global = payload.get("role_global")
        tenant_slug = payload.get("tenant_slug")
        role_local = payload.get("role_local")
        tenant_id = payload.get("tenant_id")
        
        token_data = TokenData(
            email=email, 
            role_global=role_global,
            tenant_slug=tenant_slug,
            tenant_id=tenant_id,
            role_local=role_local
        )
    except JWTError:
        raise credentials_exception
    return token_data

async def get_current_master(token_data: TokenData = Depends(get_current_user_token_data)):
    if token_data.role_global != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized as master"
        )
    return token_data

async def get_current_tenant_user(token_data: TokenData = Depends(get_current_user_token_data)):
    if not token_data.tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="No tenant context"
        )
    return token_data
