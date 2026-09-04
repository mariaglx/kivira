import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

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
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!modoEdicao) return;

    let cancelado = false;
    apiRequest(`/turma/${id}`)
      .then((turma) => {
        if (cancelado) return;
        setFormData({
          nome: turma.nome || "",
          ano_escolar: turma.ano_escolar || "",
          ano_letivo: turma.ano_letivo || new Date().getFullYear(),
          descricao: turma.descricao || "",
          ativo: turma.ativo ?? true,
        });
      })
      .catch((err) => setErro(err.message || "Não foi possível carregar a turma"))
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id, modoEdicao]);

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
        navigate(`/professor/turmas/${id}`);
      } else {
        const resposta = await apiRequest("/turma/criar", {
          method: "POST",
          data: corpo,
        });
        navigate(resposta.id ? `/professor/turmas/${resposta.id}` : "/professor/turmas");
      }
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a turma");
    } finally {
      setSalvando(false);
    }
  };

  return {
    modoEdicao,
    formData,
    handleChange,
    handleSubmit,
    carregando,
    salvando,
    erro,
  };
}
