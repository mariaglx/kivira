from pydantic import BaseModel


# Login do professor
class LoginSchema(BaseModel):
    email: str
    senha: str


# Login do aluno
class LoginAlunoSchema(BaseModel):
    username: str
    senha: str