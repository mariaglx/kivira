from fastapi import APIRouter, Depends
from models.avatar import Avatar
from dependecies import pegar_sessao_kivira

avatar_router = APIRouter(prefix="/avatar", tags=["avatar"])

# Desbloqueio por nível (só vale pro aluno; professor escolhe qualquer um):
# AVATARES_INICIAIS liberados no nível 1 e mais AVATARES_POR_NIVEL a cada nível.
# A ordem intercala as categorias (1º de cada uma, depois o 2º de cada...) pra
# todo nível trazer bichinhos variados e o começo já ter um pouco de tudo.
AVATARES_INICIAIS = 10
AVATARES_POR_NIVEL = 4


# ponytail: nível calculado pela ordem dos ids, sem coluna no banco — um avatar
# novo pode mudar o nível dos que vêm depois na mesma categoria. Se precisar
# curadoria (escolher qual bicho sai em qual nível), vira coluna avatar.nivel_minimo.
def niveis_dos_avatares(avatares):
    """{arquivo: nível mínimo} pros avatares informados."""
    por_categoria = {}
    for avatar in sorted(avatares, key=lambda a: a.id):
        por_categoria.setdefault(avatar.categoria, []).append(avatar)

    intercalados = []
    for posicao in range(max((len(lista) for lista in por_categoria.values()), default=0)):
        for categoria in sorted(por_categoria):
            if posicao < len(por_categoria[categoria]):
                intercalados.append(por_categoria[categoria][posicao])

    return {
        avatar.arquivo: 1 if i < AVATARES_INICIAIS else 2 + (i - AVATARES_INICIAIS) // AVATARES_POR_NIVEL
        for i, avatar in enumerate(intercalados)
    }


def nivel_minimo_do_avatar(session, arquivo):
    """Nível pra usar o avatar `arquivo`; None se ele não existir (ou estiver inativo)."""
    avatares = session.query(Avatar).filter(Avatar.ativo == True).all()
    return niveis_dos_avatares(avatares).get(arquivo)


@avatar_router.get("/")
def listar_avatares(session = Depends(pegar_sessao_kivira)):
    avatares = session.query(Avatar).filter(Avatar.ativo == True).all()
    niveis = niveis_dos_avatares(avatares)

    return [
        {
            "id": avatar.id,
            "nome": avatar.nome,
            "arquivo": avatar.arquivo,
            "categoria": avatar.categoria,
            "nivel_minimo": niveis[avatar.arquivo],
        }
        for avatar in sorted(avatares, key=lambda a: (niveis[a.arquivo], a.id))
    ]
