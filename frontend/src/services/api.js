import { limparSessao } from './sessao';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Cache em memória das respostas de GET: voltar pra uma tela já visitada abre
// na hora. Qualquer POST/PUT/DELETE (inclusive login e logout) limpa tudo, pra
// não mostrar dado velho depois de uma alteração nem dado de outro usuário.
// F5 também limpa, porque vive só na memória da aba. `semCache` pula o cache
// pra quem precisa do dado do momento (ex: auditoria, onde logins chegam o tempo todo).
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

// Troca de identidade sem passar por POST (ver como aluno / voltar pro admin)
export const limparCache = () => cache.clear();

export async function apiRequest(endpoint, { method = 'GET', data = null, headers = {}, signal = null, semCache = false } = {}) {
  const token = localStorage.getItem('access_token');

  if (method !== 'GET') {
    cache.clear();
  } else if (!semCache) {
    const salvo = cache.get(endpoint);
    if (salvo && Date.now() - salvo.em < CACHE_MS) return salvo.dados;
  }

  const config = {
    method,
    headers: {
      ...headers,
    },
  };

  // Permite cancelar a requisição (via AbortController) quando o componente
  // desmonta antes da resposta chegar — evita trabalho desperdiçado no
  // backend quando o StrictMode do React remonta a tela em desenvolvimento,
  // e evita setState em componente já desmontado em qualquer ambiente.
  if (signal) {
    config.signal = signal;
  }

  // Anexa o token JWT automaticamente se o usuário estiver logado
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Se for envio de dados em JSON
  if (data && !(data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    // Para formulários multipart/form-data (como o login do FastAPI)
    config.body = data;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    // Token expirado/inválido: um único tratamento pra todas as telas. Login
    // fica de fora porque lá 401 significa só "credencial errada".
    if (response.status === 401 && token && !endpoint.startsWith('/auth_kivira/')) {
      // Admin vendo como aluno cai no login do admin, não no da criança
      const destino = localStorage.getItem('user_type') === 'estudante' && !localStorage.getItem('admin_token') ? '/login_aluno' : '/login';
      limparSessao();
      window.location.assign(destino);
    }
    // Lança o erro com a mensagem do FastAPI (data.detail). O status vai junto
    // porque a tela precisa distinguir "credencial errada" (400/401) de
    // "sistema com problema" (500, rede) — a mensagem sozinha não permite isso.
    const detail = responseData?.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((d) => d.msg).join('; ')
      : detail || 'Erro na requisição';
    const erro = new Error(errorMessage);
    erro.status = response.status;
    throw erro;
  }

  if (method === 'GET' && !semCache) cache.set(endpoint, { dados: responseData, em: Date.now() });
  return responseData;
}