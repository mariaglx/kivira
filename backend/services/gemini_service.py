# Camada de serviço responsável por conversar com a API do Gemini para gerar
# pares (pergunta, resposta) de atividades. Substitui o Ollama em produção —
# o Render não permite rodar um servidor Ollama local (precisa de um processo
# expondo a porta 11434) — ver services/ollama_service.py, mantido para uso
# em desenvolvimento local.

import json
from google import genai
from google.genai import types
from google.genai.errors import APIError
from fastapi import HTTPException
from core.config import GEMINI_API_KEY, GEMINI_MODEL
from schemas.ia_geracao import GerarQuestoesSchema, PerguntaRespostaIA

_client: genai.Client | None = None


def _obter_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="GEMINI_API_KEY não configurada no servidor.")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def montar_prompt_sistema() -> str:
    return (
        "Você é um assistente pedagógico que cria pares de pergunta e resposta "
        "para uma atividade escolar no estilo do sistema LÜK, para crianças.\n"
        "Regras obrigatórias:\n"
        "1. Responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois.\n"
        "2. O JSON deve ter exatamente este formato: "
        '{"questoes": [{"texto_questao": "...", "resposta_certa": "..."}]}\n'
        "3. Cada resposta_certa deve ser curta (uma palavra ou frase curta), "
        "adequada para um bloco de tabuleiro.\n"
        "4. Nunca repita uma pergunta ou resposta já usada no contexto enviado.\n"
        "5. Gere exatamente a quantidade de pares solicitada, nem mais nem menos."
    )


def montar_prompt_usuario(dados: GerarQuestoesSchema, quantidade_faltante: int) -> str:
    linhas = [
        f"Série/ano dos alunos: {dados.serie_ano}",
        f"Disciplina: {dados.disciplina}",
        f"Título da atividade: {dados.titulo}",
        f"Dificuldade: {dados.dificuldade}",
    ]
    if dados.descricao:
        linhas.append(f"Instrução adicional do professor: {dados.descricao}")

    if dados.questoes_existentes:
        linhas.append("\nQuestões já criadas manualmente pelo professor (siga o mesmo padrão e tema):")
        for questao in dados.questoes_existentes:
            linhas.append(f"- Pergunta: {questao.texto_questao} | Resposta: {questao.resposta_certa}")

    linhas.append(f"\nGere exatamente {quantidade_faltante} novos pares de pergunta e resposta.")
    return "\n".join(linhas)


def extrair_json_da_resposta(texto_resposta: str) -> dict:
    texto = texto_resposta.strip()

    # O response_mime_type="application/json" evita isso na maioria dos casos,
    # mas mantém o mesmo fallback do ollama_service por segurança.
    if texto.startswith("```"):
        texto = texto.strip("`")
        if texto.lower().startswith("json"):
            texto = texto[4:]
        texto = texto.strip()

    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="A IA retornou uma resposta em formato inválido. Tente novamente.",
        )


async def gerar_questoes_com_ia(dados: GerarQuestoesSchema) -> list[PerguntaRespostaIA]:
    quantidade_faltante = dados.quantidade_total - len(dados.questoes_existentes)
    if quantidade_faltante <= 0:
        return []

    client = _obter_client()
    config = types.GenerateContentConfig(
        system_instruction=montar_prompt_sistema(),
        response_mime_type="application/json",
    )

    try:
        resposta = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=montar_prompt_usuario(dados, quantidade_faltante),
            config=config,
        )
    except APIError:
        raise HTTPException(status_code=502, detail="O Gemini retornou um erro ao gerar as questões.")

    dados_json = extrair_json_da_resposta(resposta.text or "")

    questoes_brutas = dados_json.get("questoes", [])
    if not isinstance(questoes_brutas, list) or not questoes_brutas:
        raise HTTPException(status_code=502, detail="A IA não retornou nenhuma questão válida.")

    questoes_geradas = []
    for item in questoes_brutas[:quantidade_faltante]:
        texto_questao = str(item.get("texto_questao", "")).strip()
        resposta_certa = str(item.get("resposta_certa", "")).strip()
        if texto_questao and resposta_certa:
            questoes_geradas.append(
                PerguntaRespostaIA(texto_questao=texto_questao, resposta_certa=resposta_certa)
            )

    if not questoes_geradas:
        raise HTTPException(status_code=502, detail="A IA não retornou nenhuma questão válida.")

    return questoes_geradas
