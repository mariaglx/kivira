# Camada de serviço responsável por conversar com o servidor Ollama local (llama3)
# para gerar pares (pergunta, resposta) de atividades. A IA nunca lida com imagens
# ou posições de tabuleiro — apenas com o texto estruturado das questões.

import json
import httpx
from fastapi import HTTPException
from core.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_SEG
from schemas.ia_geracao import GerarQuestoesSchema, PerguntaRespostaIA


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

    # Alguns modelos ainda embrulham a resposta em blocos ```json apesar do format=json
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

    payload = {
        "model": OLLAMA_MODEL,
        "system": montar_prompt_sistema(),
        "prompt": montar_prompt_usuario(dados, quantidade_faltante),
        "format": "json",
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT_SEG) as client:
            resposta = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            resposta.raise_for_status()
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao servidor Ollama. Verifique se ele está rodando localmente.",
        )
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=502, detail="O servidor Ollama retornou um erro ao gerar as questões.")

    corpo_resposta = resposta.json()
    dados_json = extrair_json_da_resposta(corpo_resposta.get("response", ""))

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
