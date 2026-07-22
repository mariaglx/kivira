from sqlalchemy.orm import Session

from app.models.aluno import Aluno
from app.models.usuario import TipoUsuario, Usuario
from app.schemas.aluno import AlunoCreate, AlunoUpdate
from app.security import hash_senha


def get_aluno(db: Session, aluno_id: int) -> Aluno | None:
    return db.get(Aluno, aluno_id)


def get_alunos(db: Session, skip: int = 0, limit: int = 100) -> list[Aluno]:
    return db.query(Aluno).offset(skip).limit(limit).all()


def create_aluno(db: Session, dados: AlunoCreate) -> Aluno:
    usuario = Usuario(
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        tipo=TipoUsuario.estudante,
    )
    db.add(usuario)
    db.flush()  # gera o usuario.id sem finalizar a transação ainda

    aluno = Aluno(
        usuario_id=usuario.id,
        nome_completo=dados.nome_completo,
        apelido=dados.apelido,
        avatar_url=dados.avatar_url,
        data_nascimento=dados.data_nascimento,
    )
    db.add(aluno)
    db.commit()
    db.refresh(aluno)
    return aluno


def update_aluno(db: Session, aluno: Aluno, dados: AlunoUpdate) -> Aluno:
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(aluno, campo, valor)
    db.commit()
    db.refresh(aluno)
    return aluno


def delete_aluno(db: Session, aluno: Aluno) -> None:
    # apaga o usuario associado; o ON DELETE CASCADE do banco remove o aluno junto
    db.delete(aluno.usuario)
    db.commit()