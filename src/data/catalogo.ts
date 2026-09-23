import type { Categoria, Produto } from './types';
import seed from './produtos.seed.json';

/**
 * Catálogo-semente embarcado no app. É o fallback quando não há API nem cache
 * (ver `src/api/produtos.ts`). Em produção o catálogo vigente vem da API e a
 * dona ajusta os preços pela área de admin.
 */
export const catalogoSeed: Produto[] = (seed.produtos as Produto[]).map((p) => ({
  ...p,
  categoria: p.categoria as Categoria,
}));

export function getProduto(lista: Produto[], id: string): Produto | undefined {
  return lista.find((p) => p.id === id);
}

const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca por nome, marca ou categoria (ignora acento/caixa). */
export function buscarProdutos(
  lista: Produto[],
  termo: string,
  categoria?: Categoria | 'Todas',
): Produto[] {
  const t = semAcento(termo.trim());
  return lista.filter((p) => {
    if (categoria && categoria !== 'Todas' && p.categoria !== categoria) return false;
    if (!t) return true;
    return (
      semAcento(p.nome).includes(t) ||
      (p.marca && semAcento(p.marca).includes(t)) ||
      semAcento(p.categoria).includes(t)
    );
  });
}

export function contarPorCategoria(lista: Produto[]): Record<string, number> {
  return lista.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] ?? 0) + 1;
    return acc;
  }, {});
}
