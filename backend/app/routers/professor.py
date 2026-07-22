from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import professor as crud_professor
from app.database import get_db
from app.schemas.professor import ProfessorCreate, ProfessorOut, ProfessorUpdate

router = APIRouter(prefix="/professores", tags=["Professores"])

# end points que o front vai ter que chamar

@router.post("", response_model=ProfessorOut, status_code=status.HTTP_201_CREATED)
def criar_professor(dados: ProfessorCreate, db: Session = Depends(get_db)):
    try:
        return crud_professor.create_professor(db, dados)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")


@router.get("", response_model=list[ProfessorOut])
def listar_professores(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return crud_professor.get_professores(db, skip=skip, limit=limit)


@router.get("/{professor_id}", response_model=ProfessorOut)
def obter_professor(professor_id: int, db: Session = Depends(get_db)):
    professor = crud_professor.get_professor(db, professor_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    return professor


@router.put("/{professor_id}", response_model=ProfessorOut)
def atualizar_professor(
    professor_id: int, dados: ProfessorUpdate, db: Session = Depends(get_db)
):
    professor = crud_professor.get_professor(db, professor_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    return crud_professor.update_professor(db, professor, dados)


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_professor(professor_id: int, db: Session = Depends(get_db)):
    professor = crud_professor.get_professor(db, professor_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    crud_professor.delete_professor(db, professor)