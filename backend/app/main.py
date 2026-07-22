from fastapi import FastAPI

from app.routers import professor, aluno, turma

app = FastAPI(title="KIVIRA API")

app.include_router(professor.router)
app.include_router(aluno.router)
app.include_router(turma.router)


@app.get("/")
def raiz():
    return {"status": "ok"}