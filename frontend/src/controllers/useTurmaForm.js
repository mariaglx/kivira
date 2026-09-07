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
  const [codigoAcesso, setCodigoAcesso] = useState(null);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Alunos e atividades só existem quando a turma já foi criada — uma "Nova
  // Turma" não tem id ainda pra buscar nada disso
  const [alunos, setAlunos] = useState([]);
  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    if (!modoEdicao) return;

    let cancelado = false;
    Promise.all([
      apiRequest(`/turma/${id}`),
      apiRequest(`/aluno_turma/turma/${id}`),
      apiRequest("/atividade/professor/minhas"),
    ])
      .then(([turma, dadosAlunos, dadosAtividades]) => {
        if (cancelado) return;
        setFormData({
          nome: turma.nome || "",
          ano_escolar: turma.ano_escolar || "",
          ano_letivo: turma.ano_letivo || new Date().getFullYear(),
          descricao: turma.descricao || "",
          ativo: turma.ativo ?? true,
        });
        setCodigoAcesso(turma.codigo_acesso || null);
        setAlunos(
          ordenarPorTexto(dadosAlunos, (a) => a.apelido || a.nome_completo),
        );
        setAtividades(
          ordenarPorTexto(
            dadosAtividades.filter((a) => a.turma_id === Number(id)),
            (a) => a.titulo,
          ),
        );
      })
      .catch((err) => setErro(err.message || "Não foi possível carregar a turma"))
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id, modoEdicao]);

  const recarregarAlunos = () => {
    apiRequest(`/aluno_turma/turma/${id}`).then((lista) =>
      setAlunos(ordenarPorTexto(lista, (a) => a.apelido || a.nome_completo)),
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        navigate("/professor/turmas");
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

  return {
    id,
    modoEdicao,
    formData,
    codigoAcesso,
    alunos,
    atividades,
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
  };
}
