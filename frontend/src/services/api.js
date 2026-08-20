const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function apiRequest(endpoint, { method = 'GET', data = null, headers = {} } = {}) {
  const token = localStorage.getItem('access_token');

  const config = {
    method,
    headers: {
      ...headers,
    },
  };

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
    // Lança o erro com a mensagem do FastAPI (data.detail)
    const errorMessage = responseData?.detail || 'Erro na requisição';
    throw new Error(errorMessage);
  }

  return responseData;
}