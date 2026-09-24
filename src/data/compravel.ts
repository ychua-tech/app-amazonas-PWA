import type { Categoria, ItemCompravel, ModoVenda, Oferta, Produto } from './types';

const PESOS_ACOUGUE = [0.5, 1, 1.5, 2];
const PESO_MEDIO_HORTIFRUTI: Record<string, number> = {
  Banana: 0.13,
  Tomate: 0.12,
  Cebola: 0.13,
  Batata: 0.15,
  Maçã: 0.16,
  Laranja: 0.2,
  Mamão: 1.1,
  Melão: 1.5,
  Melancia: 5,
  Abacaxi: 1.4,
  Cenoura: 0.1,
  Limão: 0.08,
  Mexerica: 0.13,
  Pera: 0.17,
};

/** Descobre o modo de venda quando o dado não traz `modoVenda` explícito. */
export function modoVendaPadrao(categoria: Categoria, unidade: string): ModoVenda {
  const u = unidade.toLowerCase().trim();
  if (categoria === 'Açougue') return u === 'kg' ? 'peso' : 'unidade';
  if (categoria === 'Hortifruti') return u === 'kg' ? 'unidade_ou_peso' : 'unidade';
  if (categoria === 'Frios e Laticínios' && u === 'kg') return 'peso';
  return 'unidade';
}

function pesoMedioPor(nome: string): number | undefined {
  const chave = Object.keys(PESO_MEDIO_HORTIFRUTI).find((k) =>
    nome.toLowerCase().includes(k.toLowerCase()),
  );
  return chave ? PESO_MEDIO_HORTIFRUTI[chave] : 0.15;
}

function pesosSugeridosPara(modo: ModoVenda, categoria: Categoria): number[] | undefined {
  if (modo === 'unidade') return undefined;
  if (categoria === 'Hortifruti') return [0.3, 0.5, 1, 1.5, 2];
  return PESOS_ACOUGUE;
}

export function ofertaParaCompravel(o: Oferta): ItemCompravel {
  const modo = o.modoVenda ?? modoVendaPadrao(o.categoria, o.unidade);
  return {
    id: o.id,
    nome: o.nome,
    categoria: o.categoria,
    unidade: o.unidade,
    preco: o.precoOferta,
    precoNormal: o.precoNormal,
    imagem: o.imagem,
    modoVenda: modo,
    pesosSugeridos: o.pesosSugeridos ?? pesosSugeridosPara(modo, o.categoria),
    pesoMedioUn:
      o.pesoMedioUn ??
      (modo === 'unidade_ou_peso' ? pesoMedioPor(o.nome) : undefined),
  };
}

/**
 * Mostra um produto do catálogo como se fosse uma "oferta" sem desconto (precoNormal ===
 * precoOferta) — usado na home quando não há nenhuma promoção ativa, pra tela nunca ficar vazia.
 */
export function produtoParaOfertaSemDesconto(p: Produto): Oferta {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao ?? '',
    categoria: p.categoria,
    precoNormal: p.preco,
    precoOferta: p.preco,
    unidade: p.unidade,
    imagem: p.imagem,
    validade: '2099-12-31T23:59:59.999Z', // sem promoção — não expira
    relampago: false,
    modoVenda: p.modoVenda,
    pesosSugeridos: p.pesosSugeridos,
    pesoMedioUn: p.pesoMedioUn,
  };
}

export function produtoParaCompravel(p: Produto): ItemCompravel {
  const modo = p.modoVenda ?? modoVendaPadrao(p.categoria, p.unidade);
  return {
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    unidade: p.unidade,
    preco: p.preco,
    precoNormal: undefined,
    imagem: p.imagem,
    modoVenda: modo,
    pesosSugeridos: p.pesosSugeridos ?? pesosSugeridosPara(modo, p.categoria),
    pesoMedioUn:
      p.pesoMedioUn ??
      (modo === 'unidade_ou_peso' ? pesoMedioPor(p.nome) : undefined),
  };
}

/** "1,25 kg" / "500 g" */
export function formatarPeso(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`;
}
