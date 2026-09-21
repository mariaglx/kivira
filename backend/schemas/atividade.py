from pydantic import BaseModel, Field
from typing import Optional, List

class AtividadeSchema(BaseModel):
    titulo: str
    tipo_atividade: str
    # Só é considerado quando quem está criando é admin (professores comuns têm o professor_id
    # derivado do próprio token, não do que o cliente manda)
    professor_id: Optional[int] = None
    turma_id: Optional[int] = None
    descricao: Optional[str] = None
    disciplina: Optional[str] = None
    dificuldade: Optional[str] = "facil"
    imagem_atividade_url: Optional[str] = None
    quantidade_blocos: Optional[int] = 12
    tempo_limite_seg: Optional[int] = None

class SalvarImagemPixabaySchema(BaseModel):
    # URL devolvida pela busca do Pixabay; o servidor baixa e reenvia pro Cloudinary
    url: str

class AtividadeUpdateSchema(BaseModel):
    titulo: Optional[str] = Field(default=None, examples=[None])
    descricao: Optional[str] = Field(default=None, examples=[None])
    disciplina: Optional[str] = Field(default=None, examples=[None])
    tipo_atividade: Optional[str] = Field(default=None, examples=[None])
    dificuldade: Optional[str] = Field(default=None, examples=[None])
    imagem_atividade_url: Optional[str] = Field(default=None, examples=[None])
    quantidade_blocos: Optional[int] = Field(default=None, examples=[None])
    tempo_limite_seg: Optional[int] = Field(default=None, examples=[None])
    turma_id: Optional[int] = Field(default=None, examples=[None])
    publicado: Optional[bool] = Field(default=None, examples=[None])

# Uma questão de "arrastar e soltar" tem sempre uma única resposta certa —
# por isso resposta_certa vem junto no mesmo objeto, em vez de precisar de uma
# segunda chamada pra opcao_questao. questao_id/opcao_id nulos = criar novo;
# preenchidos = atualizar o existente (mesma convenção do formulário no front).
class QuestaoComRespostaSchema(BaseModel):
    questao_id: Optional[int] = None
    opcao_id: Optional[int] = None
    texto_questao: str
    ordem: int
    pontos: Optional[int] = 10
    resposta_certa: str

# Salva todas as questões (+ respostas) de uma atividade em uma única
# requisição — evita o vaivém de 2 requests por questão que existia antes
# (criar_atividade com 12 blocos chegava a 24 requests sequenciais).
class SalvarQuestoesSchema(BaseModel):
    questoes: List[QuestaoComRespostaSchema]
    remover_questao_ids: Optional[List[int]] = []
