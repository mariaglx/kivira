# Camada de serviço responsável por validar e enviar ao Cloudinary as imagens que
# o professor sobe do próprio computador na criação de atividade (upload local,
# alternativa à busca no Pixabay). Segue o mesmo padrão de erro em HTTPException
# que ollama_service.py/pixabay_service.py já usam.

import io
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import httpx
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from core.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)

TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024  # 5MB
FORMATOS_ACEITOS = {"JPEG", "PNG", "WEBP", "GIF"}
PASTA_CLOUDINARY = "kivira/atividades"

# Só esses domínios podem ser baixados pela rota de "salvar imagem do Pixabay".
# Sem essa lista a rota viraria um proxy aberto: bastaria mandar uma URL qualquer
# pro servidor buscar endereços internos da rede em nome dele (SSRF).
DOMINIOS_PIXABAY = {"pixabay.com", "cdn.pixabay.com"}


def _validar_e_reencodar_imagem(conteudo: bytes) -> tuple[bytes, str]:
    """Prova que os bytes recebidos são uma imagem de verdade (não um arquivo
    malicioso disfarçado com content-type/extensão de imagem) e devolve uma cópia
    re-codificada do zero, descartando qualquer dado extra escondido no arquivo
    original (ex: um polyglot JPEG+ZIP)."""
    try:
        imagem = Image.open(io.BytesIO(conteudo))
        imagem.verify()
        # verify() invalida o objeto pra novas operações — reabre pra poder converter/salvar
        imagem = Image.open(io.BytesIO(conteudo))
        formato_original = imagem.format
    except (UnidentifiedImageError, ValueError, OSError):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é uma imagem válida")

    if formato_original not in FORMATOS_ACEITOS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagem não aceito. Use JPEG, PNG, WEBP ou GIF.",
        )

    tem_transparencia = imagem.mode in ("RGBA", "LA") or (
        imagem.mode == "P" and "transparency" in imagem.info
    )

    buffer_saida = io.BytesIO()
    if tem_transparencia:
        imagem.convert("RGBA").save(buffer_saida, format="PNG")
        extensao = "png"
    else:
        imagem.convert("RGB").save(buffer_saida, format="JPEG", quality=85)
        extensao = "jpg"

    return buffer_saida.getvalue(), extensao


async def enviar_imagem_atividade(conteudo: bytes) -> str:
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máximo 5MB)")

    conteudo_validado, extensao = _validar_e_reencodar_imagem(conteudo)

    try:
        resultado = cloudinary.uploader.upload(
            conteudo_validado,
            folder=PASTA_CLOUDINARY,
            format=extensao,
            resource_type="image",
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível enviar a imagem. Tente novamente.",
        )

    return resultado["secure_url"]


async def enviar_imagem_do_pixabay(url: str) -> str:
    """Baixa a imagem escolhida na busca do Pixabay e reenvia pro Cloudinary,
    devolvendo a URL definitiva.

    Motivo: as URLs que a API do Pixabay devolve (`pixabay.com/get/<hash>_640.jpg`)
    são temporárias e expiram — guardar esse link direto no banco fazia a atividade
    aparecer sem imagem depois de mais ou menos um dia. Passando pelo Cloudinary a
    imagem vira nossa e ainda herda a validação/re-codificação de
    `enviar_imagem_atividade`."""
    endereco = urlparse(url)
    if endereco.scheme != "https" or endereco.hostname not in DOMINIOS_PIXABAY:
        raise HTTPException(status_code=400, detail="Endereço de imagem não permitido")

    try:
        # follow_redirects=False de propósito: seguir redirecionamento deixaria
        # o Pixabay (ou alguém que o imite) apontar o download pra outro destino,
        # furando a checagem de domínio acima
        async with httpx.AsyncClient(timeout=20, follow_redirects=False) as cliente:
            resposta = await cliente.get(url)
            resposta.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível baixar a imagem escolhida. Tente outra.",
        )

    tamanho_informado = resposta.headers.get("content-length")
    if tamanho_informado and int(tamanho_informado) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máximo 5MB)")

    return await enviar_imagem_atividade(resposta.content)
