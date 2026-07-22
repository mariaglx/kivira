from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import turma as crud_turma
from app.database import get_db
from app.schemas.turma import TurmaCreate, TurmaOut, TurmaUpdate

router = APIRouter(prefix="/turmas", tags=["Turmas"])


@router.post("", response_model=TurmaOut, status_code=status.HTTP_201_CREATED)
def criar_turma(dados: TurmaCreate, db: Session = Depends(get_db)):
    try:
        return crud_turma.create_turma(db, dados)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="professor_id inválido")


@router.get("", response_model=list[TurmaOut])
def listar_turmas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_turma.get_turmas(db, skip=skip, limit=limit)


@router.get("/{turma_id}", response_model=TurmaOut)
def obter_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = crud_turma.get_turma(db, turma_id)
    if turma is None:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return turma


@router.put("/{turma_id}", response_model=TurmaOut)
def atualizar_turma(turma_id: int, dados: TurmaUpdate, db: Session = Depends(get_db)):
    turma = crud_turma.get_turma(db, turma_id)
    if turma is None:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return crud_turma.update_turma(db, turma, dados)


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_turma(turma_id: int, db: Session = Depends(get_db)):
    turma = crud_turma.get_turma(db, turma_id)
    if turma is None:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    crud_turma.delete_turma(db, turma)