from pydantic import BaseModel

class LoginMaster(BaseModel):
    email: str
    password: str

class LoginTenant(BaseModel):
    email: str
    password: str
    tenant_slug: str

class SelectTenant(BaseModel):
    tenant_slug: str
