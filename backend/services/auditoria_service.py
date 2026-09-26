# Registro de logs de auditoria — quem fez o quê, com o papel que a pessoa tinha
# no momento da ação. Usado pelas rotas que alteram dados sensíveis (criação/edição/
# exclusão de atividades, turmas, professores, alunos etc).

import json
from models.log_auditoria import LogAuditoria
from models.usuario import Usuario


def registrar_log(session, usuario: Usuario, acao: str, entidade: str, entidade_id: int = None, detalhes: dict = None):
    """
    Grava uma entrada de auditoria e faz commit próprio.
    ponytail: transação separada da operação principal — se o log falhar, a ação
    já foi salva sem registro. Para ficar atômico, tirar o commit daqui e chamar
    antes do commit da rota.
    """
    log = LogAuditoria(
        usuario_id=usuario.id,
        papel_usuario=usuario.tipo,
        acao=acao,
        entidade=entidade,
        entidade_id=entidade_id,
        detalhes=json.dumps(detalhes, ensure_ascii=False, default=str) if detalhes else None,
    )
    session.add(log)
    session.commit()
