from pydantic import BaseModel


class PerfilAdminSchema(BaseModel):
    avatar_url: str
