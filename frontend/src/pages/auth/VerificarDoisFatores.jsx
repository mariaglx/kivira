import { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { apiRequest } from "../../services/api";
import { Alerta } from "../../components/ui/Alerta";

// Segunda etapa do login do admin: código do app autenticador (Google
// Authenticator, Authy...). No primeiro acesso mostra o QR pra escanear antes.
// `token` é o token de meio de login (5 min) que só vale nas rotas do 2FA.
export function VerificarDoisFatores({ token, qrCode, segredo, onEntrar, onVoltar }) {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const data = await apiRequest("/auth_kivira/2fa/verificar", {
        method: "POST",
        data: { codigo },
        headers: { Authorization: `Bearer ${token}` },
      });
      onEntrar(data);
    } catch (err) {
      setErro(err.message || "Código inválido.");
      setCodigo("");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {qrCode ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-gray-600 text-base">
            Admins entram com verificação em duas etapas. Escaneie o QR code com um app autenticador
            (Google Authenticator, Authy...) e digite o código que aparecer.
          </p>
          <img src={qrCode} alt="QR code para configurar o app autenticador" className="w-48 h-48" />
          <p className="text-xs text-gray-500 break-all">
            Sem câmera? Digite a chave no app: <code className="font-mono">{segredo}</code>
          </p>
        </div>
      ) : (
        <p className="text-gray-600 text-base text-center">Digite o código de 6 dígitos do seu app autenticador.</p>
      )}

      {erro && (
        <Alerta className="text-center justify-center">
          {erro}
        </Alerta>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="codigo-2fa" className="text-start text-gray-600 text-base font-medium">
          Código
        </label>
        <Input
          id="codigo-2fa"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          className="text-base py-3 px-4 tracking-[0.4em] text-center"
          autoFocus
          required
        />
      </div>

      <Button type="submit" disabled={enviando || codigo.length !== 6}>
        {enviando ? "Verificando..." : "Entrar"}
      </Button>
      <button type="button" onClick={onVoltar} className="text-sm text-gray-500 hover:underline">
        Voltar
      </button>
    </form>
  );
}
