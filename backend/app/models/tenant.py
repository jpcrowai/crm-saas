from pydantic import BaseModel

class TenantUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
