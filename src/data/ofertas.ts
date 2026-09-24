import { produtoImagens } from './produtoImagens';
import type { Oferta } from './types';
import seed from './ofertas.seed.json';

/**
 * Ofertas de exemplo do encarte "Ofertão da Independência".
 * Fonte: src/data/ofertas.seed.json (mesma base do servidor).
 * As datas de validade são calculadas na carga para o demo não expirar —
 * em produção elas vêm da API com data real.
 */
type SeedItem = (typeof seed.ofertas)[number] & {
  relampago?: boolean;
  perecivel?: boolean;
};

const emDias = (d: number) => {
  const dt = new Date();
  dt.setHours(23, 59, 0, 0);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};
const emHoras = (h: number) => {
  const dt = new Date();
  dt.setHours(dt.getHours() + h, 0, 0, 0);
  return dt.toISOString();
};

export const ofertas: Oferta[] = (seed.ofertas as SeedItem[]).map((o) => ({
  id: o.id,
  nome: o.nome,
  descricao: o.descricao,
  categoria: o.categoria as Oferta['categoria'],
  precoNormal: o.precoNormal,
  precoOferta: o.precoOferta,
  unidade: o.unidade,
  imagem: produtoImagens[o.id],
  // perecíveis (hortifruti / açougue) valem menos dias
  validade: emDias(o.perecivel ? 3 : 6),
  relampago: o.relampago,
  relampagoFim: o.relampago ? emHoras(o.perecivel ? 5 : 8) : undefined,
}));

export function getOferta(id: string): Oferta | undefined {
  return ofertas.find((o) => o.id === id);
}

export function ofertasRelampago(): Oferta[] {
  return ofertas.filter((o) => o.relampago);
}
