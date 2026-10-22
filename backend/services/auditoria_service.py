# Registro de logs de auditoria — quem fez o quê, com o papel que a pessoa tinha
# no momento da ação, e de onde (IP e navegador). Usado pelas rotas que alteram
# dados sensíveis e pelo login (inclusive as tentativas que falham).

import json
from contextvars import ContextVar
from models.log_auditoria import LogAuditoria
from models.usuario import Usuario

# Preenchido por requisição pelo middleware em main.py — assim toda chamada de
# registrar_log já grava IP e navegador sem cada rota precisar receber o Request.
origem_requisicao: ContextVar[dict] = ContextVar("origem_requisicao", default={})


def registrar_log(session, usuario: Usuario | None, acao: str, entidade: str, entidade_id: int = None, detalhes: dict = None, papel: str = None):
    """
    Grava uma entrada de auditoria e faz commit próprio. `usuario` pode ser None
    (tentativa de login de alguém que não existe) — aí `papel` diz qual tela de
    login foi usada.
    ponytail: transação separada da operação principal — se o log falhar, a ação
    já foi salva sem registro. Para ficar atômico, tirar o commit daqui e chamar
    antes do commit da rota.
    """
    detalhes = {**(detalhes or {}), **{k: v for k, v in origem_requisicao.get().items() if v}}
    log = LogAuditoria(
        usuario_id=usuario.id if usuario else None,
        papel_usuario=usuario.tipo if usuario else papel,
        acao=acao,
        entidade=entidade,
        entidade_id=entidade_id,
        detalhes=json.dumps(detalhes, ensure_ascii=False, default=str) if detalhes else None,
    )
    session.add(log)
    session.commit()
