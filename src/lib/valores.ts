import { loja } from '../data/loja';

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Entrega grátis a partir de `loja.entregaGratisAPartirDe` em itens; abaixo disso cobra a taxa. */
export function taxaDeEntrega(subtotal: number): number {
  return round2(subtotal) >= loja.entregaGratisAPartirDe ? 0 : loja.taxaEntrega;
}

/** Quanto falta em itens pra entrega ficar grátis (0 se já é grátis). */
export function faltaParaEntregaGratis(subtotal: number): number {
  return Math.max(0, round2(loja.entregaGratisAPartirDe - subtotal));
}

/** total = itens − cashback − bônus de aniversário + taxa de entrega (nunca negativo). */
export function totalDoPedido(p: {
  subtotal: number;
  cashback?: number;
  bonus?: number;
  taxaEntrega?: number;
}): number {
  return Math.max(0, round2(p.subtotal - (p.cashback ?? 0) - (p.bonus ?? 0) + (p.taxaEntrega ?? 0)));
}
