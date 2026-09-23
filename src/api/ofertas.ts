import AsyncStorage from '@react-native-async-storage/async-storage';
import { ofertas as ofertasMock } from '../data/ofertas';
import { produtoImagens } from '../data/produtoImagens';
import type { Oferta } from '../data/types';
import { API_ATIVA } from './config';
import { apiFetch } from './http';

const CACHE_KEY = '@amazonas/cache/ofertas';

/**
 * A API ainda não hospeda as fotos do encarte (elas vêm empacotadas no app,
 * mapeadas por id em `produtoImagens`). Enquanto o campo `imagem` da API vier
 * vazio, usamos o asset local quando existe um para aquele id.
 */
function comFoto(lista: Oferta[]): Oferta[] {
  return lista.map((o) =>
    o.imagem ? o : { ...o, imagem: produtoImagens[o.id] },
  );
}

async function lerCache(): Promise<Oferta[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Oferta[]) : null;
  } catch {
    return null;
  }
}

async function gravarCache(lista: Oferta[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(lista));
  } catch {
    // sem espaço / indisponível — segue a vida
  }
}

/**
 * Ordem de preferência:
 *  1. API (se configurada) — e atualiza o cache
 *  2. cache local (última resposta boa)
 *  3. dados de exemplo embarcados
 */
export async function getOfertas(): Promise<Oferta[]> {
  if (API_ATIVA) {
    try {
      const lista = await apiFetch<Oferta[]>('/ofertas');
      await gravarCache(lista);
      return comFoto(lista);
    } catch {
      const cache = await lerCache();
      if (cache) return comFoto(cache);
    }
  }
  return ofertasMock;
}

export async function getOferta(id: string): Promise<Oferta | undefined> {
  const lista = await getOfertas();
  return lista.find((o) => o.id === id);
}

export function filtrarRelampago(lista: Oferta[]): Oferta[] {
  return lista.filter((o) => o.relampago && !expirou(o));
}

export function expirou(o: Oferta): boolean {
  if (o.relampago && o.relampagoFim) {
    return new Date(o.relampagoFim).getTime() <= Date.now();
  }
  return new Date(o.validade).getTime() <= Date.now();
}
