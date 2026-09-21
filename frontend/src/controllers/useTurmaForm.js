import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

// O backend devolve as listas na ordem de criação, mas a professora procura
// por nome. Ordena sempre pelo mesmo texto que aparece na tela, e com
// localeCompare pt-BR — senão acento manda "Vinícius" pra depois de "Vitor"
const ordenarPorTexto = (lista, rotulo) =>
  [...lista].sort((a, b) =>
    (rotulo(a) || "").localeCompare(rotulo(b) || "", "pt-BR", {
      sensitivity: "base",
    }),
  );

const FORM_VAZIO = {
  nome: "",
  ano_escolar: "",
  ano_letivo: new Date().getFullYear(),
  descricao: "",
  ativo: true,
};

export function useTurmaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modoEdicao = !!id;

  const [formData, setFormData] = useState(FORM_VAZIO);
  const [dadosOriginais, setDadosOriginais] = useState(null);
  const [codigoAcesso, setCodigoAcesso] = useState(null);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Alunos e atividades só existem quando a turma já foi criada — uma "Nova
  // Turma" não tem id ainda pra buscar nada disso
  const [alunos, setAlunos] = useState([]);
  const [atividades, setAtividades] = useState([]);

  // Ranking vem pronto do servidor (ordenado por XP, com as atividades
  // concluídas contadas lá) — o denominador é só o que está publicado, por
  // isso não dá pra usar `atividades.length` daqui no lugar dele.
  const [rankingAlunos, setRankingAlunos] = useState([]);
  const [totalAtividadesPublicadas, setTotalAtividadesPublicadas] = useState(0);

  useEffect(() => {
    if (!modoEdicao) return;

    let cancelado = false;
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    // /atividade/professor/minhas?turma_id=<id>: antes buscava TODAS as
    // atividades do professor (de todas as turmas) só pra filtrar no cliente
    // as dessa turma — quanto mais atividades o professor tivesse, mais lento
    // ficava abrir qualquer turma pra editar.
    Promise.all([
      apiRequest(`/turma/${id}`, opcoesFetch),
      apiRequest(`/aluno_turma/turma/${id}`, opcoesFetch),
      apiRequest(`/atividade/professor/minhas?turma_id=${id}`, opcoesFetch),
      apiRequest(`/turma/${id}/ranking`, opcoesFetch),
    ])
      .then(([turma, dadosAlunos, dadosAtividades, dadosRanking]) => {
        if (cancelado) return;
        const carregado = {
          nome: turma.nome || "",
          ano_escolar: turma.ano_escolar || "",
          ano_letivo: turma.ano_letivo || new Date().getFullYear(),
          descricao: turma.descricao || "",
          ativo: turma.ativo ?? true,
        };
        setFormData(carregado);
        // Foto do que veio do banco: é contra ela que a tela decide se há
        // alteração pendente. Alunos e atividades ficam de fora de propósito —
        // eles são salvos na hora, por conta própria, não dependem deste form.
        setDadosOriginais(carregado);
        setCodigoAcesso(turma.codigo_acesso || null);
        setAlunos(
          ordenarPorTexto(dadosAlunos, (a) => a.apelido || a.nome_completo),
        );
        setAtividades(ordenarPorTexto(dadosAtividades, (a) => a.titulo));
        setRankingAlunos(dadosRanking.ranking || []);
        setTotalAtividadesPublicadas(dadosRanking.total_atividades || 0);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setErro(err.message || "Não foi possível carregar a turma");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [id, modoEdicao]);

  const recarregarAlunos = () => {
    apiRequest(`/aluno_turma/turma/${id}`).then((lista) =>
      setAlunos(ordenarPorTexto(lista, (a) => a.apelido || a.nome_completo)),
    );
    // Entrar/sair da turma muda quem aparece no ranking, então ele recarrega junto
    apiRequest(`/turma/${id}/ranking`).then((dados) => {
      setRankingAlunos(dados.ranking || []);
      setTotalAtividadesPublicadas(dados.total_atividades || 0);
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Só os campos do formulário entram na conta. Adicionar ou remover aluno não
  // "suja" a turma: essas ações já vão pro banco na hora, por rota própria.
  const houveAlteracao =
    !modoEdicao ||
    (dadosOriginais !== null &&
      JSON.stringify(formData) !== JSON.stringify(dadosOriginais));

  // "Cancelar" ao lado de "Salvar" desfaz a edição em vez de sair da tela —
  // mesma regra já adotada na tela de atividade
  const desfazerAlteracoes = () => {
    if (dadosOriginais) setFormData(dadosOriginais);
    setErro(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (salvando) return;

    setSalvando(true);
    setErro(null);
    try {
      const corpo = {
        nome: formData.nome,
        ano_escolar: formData.ano_escolar,
        ano_letivo: Number(formData.ano_letivo),
        descricao: formData.descricao || null,
        ativo: formData.ativo,
      };

      if (modoEdicao) {
        await apiRequest(`/turma/${id}`, { method: "PATCH", data: corpo });
        // Fica na tela: o professor costuma continuar mexendo em alunos e
        // atividades da turma depois de salvar. O que veio de volta vira o novo
        // "original", então os botões somem sozinhos — é esse o aviso de que
        // salvou, sem precisar de modal.
        setDadosOriginais(formData);
      } else {
        const resposta = await apiRequest("/turma/criar", {
          method: "POST",
          data: corpo,
        });
        navigate(resposta.id ? `/professor/turmas/${resposta.id}/editar` : "/professor/turmas");
      }
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a turma");
    } finally {
      setSalvando(false);
    }
  };

  // Cadastro de aluno de dentro da turma — a senha de primeiro acesso é gerada
  // pelo backend e só existe nessa resposta (não dá pra recuperar depois)
  const [modalAlunoAberto, setModalAlunoAberto] = useState(false);
  const [nomeAluno, setNomeAluno] = useState("");
  const [sobrenomeAluno, setSobrenomeAluno] = useState("");
  const [cadastrandoAluno, setCadastrandoAluno] = useState(false);
  const [erroCadastroAluno, setErroCadastroAluno] = useState(null);
  const [alunoCriado, setAlunoCriado] = useState(null); // {username, senha_temporaria}

  const abrirModalAluno = () => {
    setNomeAluno("");
    setSobrenomeAluno("");
    setErroCadastroAluno(null);
    setAlunoCriado(null);
    setModalAlunoAberto(true);
  };

  const fecharModalAluno = () => {
    setModalAlunoAberto(false);
  };

  const cadastrarAluno = async (e) => {
    e.preventDefault();

    if (!nomeAluno.trim() || !sobrenomeAluno.trim()) {
      setErroCadastroAluno("Preencha nome e sobrenome.");
      return;
    }

    setErroCadastroAluno(null);
    setCadastrandoAluno(true);
    try {
      const resposta = await apiRequest("/aluno/cadastrar", {
        method: "POST",
        data: {
          nome_completo: `${nomeAluno.trim()} ${sobrenomeAluno.trim()}`,
          turma_id: Number(id),
        },
      });
      setAlunoCriado({
        username: resposta.username,
        senha_temporaria: resposta.senha_temporaria,
      });
      recarregarAlunos();
    } catch (erro) {
      setErroCadastroAluno(erro.message || "Erro ao cadastrar aluno");
    } finally {
      setCadastrandoAluno(false);
    }
  };

  // Remover aluno = desmatricular da turma (aluno_turma), não apaga a conta dele.
  // A confirmação é um modal nosso (não window.confirm) pra caber a explicação
  // de que a conta do aluno continua existindo — o confirm nativo não deixa
  const [removendoMatriculaId, setRemovendoMatriculaId] = useState(null);
  const [alunoParaRemover, setAlunoParaRemover] = useState(null);
  const [erroAcaoAluno, setErroAcaoAluno] = useState(null);

  const pedirRemocaoAluno = (aluno) =>
    setAlunoParaRemover({
      matricula_id: aluno.matricula_id,
      nome: aluno.nome_completo || aluno.apelido,
    });

  const cancelarRemocaoAluno = () => setAlunoParaRemover(null);

  const confirmarRemocaoAluno = async () => {
    if (!alunoParaRemover) return;

    setRemovendoMatriculaId(alunoParaRemover.matricula_id);
    try {
      await apiRequest(`/aluno_turma/${alunoParaRemover.matricula_id}`, {
        method: "DELETE",
      });
      setAlunoParaRemover(null);
      recarregarAlunos();
    } catch (erro) {
      setAlunoParaRemover(null);
      setErroAcaoAluno(erro.message || "Não foi possível remover o aluno da turma.");
    } finally {
      setRemovendoMatriculaId(null);
    }
  };

  // Gerar nova senha temporária de um aluno já cadastrado ("olhinho" na lista)
  // — não dá pra reaver a senha antiga (fica só o hash), então isso sempre
  // gera uma nova e invalida a anterior
  const [resetandoSenhaAlunoId, setResetandoSenhaAlunoId] = useState(null);
  const [senhaResetada, setSenhaResetada] = useState(null); // {username, senha_temporaria}

  const resetarSenhaAluno = async (alunoId) => {
    setResetandoSenhaAlunoId(alunoId);
    try {
      const resposta = await apiRequest(`/aluno/${alunoId}/resetar_senha`, {
        method: "PATCH",
      });
      setSenhaResetada({
        username: resposta.username,
        senha_temporaria: resposta.senha_temporaria,
      });
    } catch (erro) {
      setErroAcaoAluno(erro.message || "Não foi possível gerar uma nova senha.");
    } finally {
      setResetandoSenhaAlunoId(null);
    }
  };

  const fecharSenhaResetada = () => setSenhaResetada(null);
  const fecharErroAcaoAluno = () => setErroAcaoAluno(null);

  // Exclusão da turma. O banco cuida das dependências sozinho e de formas
  // diferentes: `aluno_turma` é CASCADE (as matrículas somem, os alunos não),
  // `atividade` e `sessao_jogo` são SET NULL (sobrevivem, só perdem o vínculo).
  // Por isso a confirmação na tela pode dizer exatamente o que se perde.
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const abrirExclusao = () => setModalExclusaoAberto(true);
  const fecharExclusao = () => setModalExclusaoAberto(false);

  const excluirTurma = async () => {
    setExcluindo(true);
    setErro(null);
    try {
      await apiRequest(`/turma/${id}`, { method: "DELETE" });
      navigate("/professor/turmas");
    } catch (err) {
      setModalExclusaoAberto(false);
      setErro(err.message || "Não foi possível excluir a turma");
    } finally {
      setExcluindo(false);
    }
  };

  // Fila de impressão de credenciais — só existe no navegador (sessionStorage),
  // nunca no banco. É a única forma de "guardar" a senha em texto puro, já que
  // depois de gerada ela só existe como hash. Sobrevive a um F5 na mesma aba,
  // mas some ao fechar — suficiente pro caso de uso (cadastrar a turma toda numa
  // sentada e imprimir no fim).
  const chaveFilaImpressao = `fila_impressao_turma_${id}`;

  const [filaImpressao, setFilaImpressao] = useState(() => {
    if (!modoEdicao) return [];
    try {
      return JSON.parse(sessionStorage.getItem(chaveFilaImpressao)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!modoEdicao) return;
    sessionStorage.setItem(chaveFilaImpressao, JSON.stringify(filaImpressao));
  }, [filaImpressao, chaveFilaImpressao, modoEdicao]);

  const adicionarNaFilaImpressao = (username, senha_temporaria) => {
    setFilaImpressao((atual) => [...atual, { username, senha_temporaria }]);
  };

  const limparFilaImpressao = () => setFilaImpressao([]);

  return {
    id,
    modoEdicao,
    formData,
    codigoAcesso,
    alunos,
    atividades,
    rankingAlunos,
    totalAtividadesPublicadas,
    handleChange,
    handleSubmit,
    carregando,
    salvando,
    erro,
    modalAlunoAberto,
    abrirModalAluno,
    fecharModalAluno,
    nomeAluno,
    setNomeAluno,
    sobrenomeAluno,
    setSobrenomeAluno,
    cadastrandoAluno,
    erroCadastroAluno,
    alunoCriado,
    cadastrarAluno,
    removendoMatriculaId,
    alunoParaRemover,
    pedirRemocaoAluno,
    cancelarRemocaoAluno,
    confirmarRemocaoAluno,
    resetandoSenhaAlunoId,
    senhaResetada,
    resetarSenhaAluno,
    fecharSenhaResetada,
    erroAcaoAluno,
    fecharErroAcaoAluno,
    filaImpressao,
    adicionarNaFilaImpressao,
    limparFilaImpressao,
    houveAlteracao,
    desfazerAlteracoes,
    modalExclusaoAberto,
    abrirExclusao,
    fecharExclusao,
    excluirTurma,
    excluindo,
  };
}
