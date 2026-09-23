import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogoSeed } from '../data/catalogo';
import type { Produto } from '../data/types';
import { API_ATIVA } from './config';
import { apiFetch } from './http';

const CACHE_KEY = '@amazonas/cache/produtos';

async function lerCache(): Promise<Produto[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Produto[]) : null;
  } catch {
    return null;
  }
}

async function gravarCache(lista: Produto[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(lista));
  } catch {
    // sem espaço / indisponível — segue a vida
  }
}

/**
 * Catálogo do mercado. Mesma ordem de preferência das ofertas:
 *  1. API (se configurada) — e atualiza o cache
 *  2. cache local (última resposta boa)
 *  3. catálogo-semente embarcado
 */
export async function getProdutos(): Promise<Produto[]> {
  if (API_ATIVA) {
    try {
      const lista = await apiFetch<Produto[]>('/produtos');
      if (Array.isArray(lista) && lista.length > 0) {
        await gravarCache(lista);
        return lista;
      }
    } catch {
      // cai no cache / seed abaixo
    }
    const cache = await lerCache();
    if (cache) return cache;
  }
  return catalogoSeed;
}
