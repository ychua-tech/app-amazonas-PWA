import { API_TIMEOUT, API_URL } from './config';
import { ApiError } from './http';

/**
 * Chamada às rotas `/admin/*` do servidor, com o header `x-admin-token`.
 * Lança `ApiError` (com `.status`) em falha — 401 = token inválido/expirado.
 */
export async function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) throw new ApiError('Configure EXPO_PUBLIC_API_URL para usar o admin');
  if (!token) throw new ApiError('Sem token de admin', 401);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const corpo = (await res.json().catch(() => ({}))) as { erro?: string };
      throw new ApiError(corpo.erro || `Erro ${res.status} em ${path}`, res.status);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError('Tempo de conexão esgotado');
    }
    throw new ApiError('Falha de conexão com o servidor');
  } finally {
    clearTimeout(timer);
  }
}
