from pydantic import BaseModel

class AmbienteCreate(BaseModel):
    nome: str
    slug: str
    logo_url: str | None = None
    nicho: str | None = None
    cor_principal: str | None = None
