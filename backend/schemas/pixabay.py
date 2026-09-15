from pydantic import BaseModel


# Uma imagem devolvida pelo Pixabay, já reduzida aos campos que o frontend usa:
# url_preview (miniatura, pra mostrar a grade de resultados) e url_imagem (versão
# maior, que vira o valor salvo em atividade.imagem_atividade_url ao ser escolhida)
class ImagemPixabaySchema(BaseModel):
    id: int
    tags: str
    url_preview: str
    url_imagem: str


class BuscarImagensPixabayResponse(BaseModel):
    total: int
    imagens: list[ImagemPixabaySchema]
