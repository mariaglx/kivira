# Controle de acesso baseado em papéis (RBAC).
#
# O papel do usuário já existe como o campo Usuario.tipo (enum "tipo_usuario_enum"
# no banco: admin | professor | estudante). Esse módulo não cria uma tabela nova de
# papéis porque, no Kivira, cada usuário tem exatamente um papel principal — um enum
# no próprio usuário é suficiente e evita o join extra que uma tabela separada exigiria.
# Se um dia for preciso um usuário com múltiplos papéis (ex: professor que também
# modera turmas de outros), aí sim vale migrar para uma tabela usuario_papel N:N.

from enum import Enum
from fastapi import Depends, HTTPException, status
from models.usuario import Usuario
from dependecies import verificar_token_kivira


class Papel(str, Enum):
    ADMIN = "admin"
    PROFESSOR = "professor"
    # O valor no banco (enum tipo_usuario_enum) é "estudante", não "aluno" —
    # mantemos o nome ALUNO aqui só por legibilidade no código.
    ALUNO = "estudante"


def exigir_papel(*papeis_permitidos: Papel):
    """
    Dependência do FastAPI que restringe uma rota a um ou mais papéis.

    Uso:
        @router.get("/admin/usuarios", dependencies=[Depends(exigir_papel(Papel.ADMIN))])

        @router.post("/atividade", dependencies=[Depends(exigir_papel(Papel.ADMIN, Papel.PROFESSOR))])

    Retorna 401 se o token for inválido/ausente (verificar_token_kivira já cobre isso)
    e 403 se o usuário estiver autenticado mas o papel dele não estiver na lista.
    """
    papeis_valores = {papel.value for papel in papeis_permitidos}

    def verificar(usuario: Usuario = Depends(verificar_token_kivira)) -> Usuario:
        if usuario.tipo not in papeis_valores:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso",
            )
        return usuario

    return verificar


# Atalhos prontos para os casos mais comuns, pra não ficar repetindo
# Depends(exigir_papel(Papel.ADMIN)) em toda rota admin-only.
somente_admin = exigir_papel(Papel.ADMIN)
admin_ou_professor = exigir_papel(Papel.ADMIN, Papel.PROFESSOR)
somente_aluno = exigir_papel(Papel.ALUNO)
