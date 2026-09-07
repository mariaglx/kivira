# Camada de serviço responsável por conversar com a API do Pixabay para buscar
# imagens usadas na criação de atividades. Como o público do Kivira é infantil,
# a busca roda sempre com safesearch ativado, independente do que o professor digitar.

import httpx
from fastapi import HTTPException
from core.config import API_PIXABAY_URL, API_PIXABAY_KEY
from schemas.pixabay import ImagemPixabaySchema, BuscarImagensPixabayResponse

TIMEOUT_SEG = 10
POR_PAGINA = 20

TIPOS_IMAGEM_ACEITOS = {"all", "photo", "illustration", "vector"}
CORES_ACEITAS = {
    "grayscale", "transparent", "red", "orange", "yellow", "green",
    "turquoise", "blue", "lilac", "pink", "white", "gray", "black", "brown",
}


async def buscar_imagens_pixabay(
    termo: str,
    pagina: int,
    tipo_imagem: str = "illustration",
    cor: str | None = None,
) -> BuscarImagensPixabayResponse:
    if tipo_imagem not in TIPOS_IMAGEM_ACEITOS:
        tipo_imagem = "illustration"

    parametros = {
        "key": API_PIXABAY_KEY,
        "q": termo,
        "lang": "pt",
        "image_type": tipo_imagem,
        "safesearch": "true",
        "page": pagina,
        "per_page": POR_PAGINA,
    }

    if cor and cor in CORES_ACEITAS:
        parametros["colors"] = cor

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SEG) as client:
            resposta = await client.get(API_PIXABAY_URL, params=parametros)
            resposta.raise_for_status()
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao Pixabay. Tente novamente.",
        )
    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="O Pixabay retornou um erro ao buscar as imagens.",
        )

    corpo_resposta = resposta.json()

    imagens = [
        ImagemPixabaySchema(
            id=item["id"],
            tags=item["tags"],
            url_preview=item["previewURL"],
            url_imagem=item["webformatURL"],
        )
        for item in corpo_resposta.get("hits", [])
    ]

    return BuscarImagensPixabayResponse(
        total=corpo_resposta.get("totalHits", 0),
        imagens=imagens,
    )
