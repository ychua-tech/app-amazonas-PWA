import { avisoAtual } from '../data/aviso';
import type { Aviso } from '../data/types';
import { API_ATIVA } from './config';
import { apiFetch } from './http';

function valido(a: Aviso | null): a is Aviso {
  if (!a || !a.ativo) return false;
  if (a.expira && new Date(a.expira).getTime() <= Date.now()) return false;
  return true;
}

/**
 * Aviso de abertura: API quando configurada (pode retornar null = sem aviso),
 * senão o exemplo local. Nunca lança.
 */
export async function getAviso(): Promise<Aviso | null> {
  if (API_ATIVA) {
    try {
      const a = await apiFetch<Aviso | null>('/aviso');
      return valido(a) ? a : null;
    } catch {
      return null; // API no ar mas falhou → não incomoda o usuário
    }
  }
  return valido(avisoAtual) ? avisoAtual : null;
}
