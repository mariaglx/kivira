from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import aluno as crud_aluno
from app.database import get_db
from app.schemas.aluno import AlunoCreate, AlunoOut, AlunoUpdate

router = APIRouter(prefix="/alunos", tags=["Alunos"])


@router.post("", response_model=AlunoOut, status_code=status.HTTP_201_CREATED)
def criar_aluno(dados: AlunoCreate, db: Session = Depends(get_db)):
    try:
        return crud_aluno.create_aluno(db, dados)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")


@router.get("", response_model=list[AlunoOut])
def listar_alunos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_aluno.get_alunos(db, skip=skip, limit=limit)


@router.get("/{aluno_id}", response_model=AlunoOut)
def obter_aluno(aluno_id: int, db: Session = Depends(get_db)):
    aluno = crud_aluno.get_aluno(db, aluno_id)
    if aluno is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return aluno


@router.put("/{aluno_id}", response_model=AlunoOut)
def atualizar_aluno(aluno_id: int, dados: AlunoUpdate, db: Session = Depends(get_db)):
    aluno = crud_aluno.get_aluno(db, aluno_id)
    if aluno is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return crud_aluno.update_aluno(db, aluno, dados)


@router.delete("/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_aluno(aluno_id: int, db: Session = Depends(get_db)):
    aluno = crud_aluno.get_aluno(db, aluno_id)
    if aluno is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    crud_aluno.delete_aluno(db, aluno)