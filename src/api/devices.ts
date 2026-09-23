import { API_ATIVA } from './config';
import { apiFetch } from './http';

/**
 * Registra o push token do aparelho no backend para receber ofertas relâmpago.
 * Silencioso: se a API não estiver configurada ou falhar, não faz nada.
 */
export async function registrarDispositivo(token: string): Promise<void> {
  if (!API_ATIVA) return;
  try {
    await apiFetch('/devices', {
      method: 'POST',
      body: JSON.stringify({ token, plataforma: 'expo' }),
    });
  } catch {
    // tenta de novo na próxima abertura do app
  }
}
