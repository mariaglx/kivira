#Valida os dados antes de realizar ações (Ex: Crud)

from datetime import datetime

from pydantic import BaseModel, ConfigDict 

from app.models.usuario import TipoUsuario

class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int 
    email: str 
    tipo: TipoUsuario
    data_criacao: datetime