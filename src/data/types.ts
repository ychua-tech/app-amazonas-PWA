export type Categoria =
  | 'Hortifruti'
  | 'Açougue'
  | 'Padaria'
  | 'Mercearia'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene'
  | 'Pet'
  | 'Frios e Laticínios';

export const CATEGORIAS: Categoria[] = [
  'Hortifruti',
  'Açougue',
  'Padaria',
  'Frios e Laticínios',
  'Mercearia',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Pet',
];

/**
 * Como o produto é vendido:
 * - `unidade`: peça fechada / embalagem (arroz, refrigerante, sabão).
 * - `peso`: vendido a quilo, o cliente escolhe o peso aproximado (carnes, queijo em peça).
 * - `unidade_ou_peso`: o cliente decide (hortifruti solto — 1 banana ou 0,5 kg).
 */
export type ModoVenda = 'unidade' | 'peso' | 'unidade_ou_peso';

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  marca?: string;
  descricao?: string;
  /** rótulo da venda: "un", "kg", "pacote 5kg", "bandeja 250g" */
  unidade: string;
  /** preço de venda (por unidade OU por kg, conforme modoVenda) */
  preco: number;
  imagem?: string | number;
  modoVenda: ModoVenda;
  /** modo peso: pesos sugeridos em kg (ex.: [0.3, 0.5, 1, 1.5, 2]) */
  pesosSugeridos?: number[];
  /** unidade_ou_peso: peso médio de 1 unidade em kg (ex.: banana ≈ 0,12) */
  pesoMedioUn?: number;
  /** ISO — última vez que o preço mudou pelo admin (null = nunca / seed) */
  atualizadoEm?: string | null;
  /** preços anteriores, mais recente primeiro (últimos 10) */
  historicoPreco?: { preco: number; em: string }[];
}

export interface Oferta {
  id: string;
  nome: string;
  descricao: string;
  categoria: Categoria;
  precoNormal: number;
  precoOferta: number;
  unidade: string; // ex: "kg", "un", "pacote 1kg"
  imagem?: string | number; // URL (API) ou asset via require(); vazio = placeholder por categoria
  validade: string; // ISO date — fim da oferta
  relampago?: boolean;
  /** Para ofertas relâmpago: horário de término */
  relampagoFim?: string; // ISO datetime
  /** herda de Produto quando a oferta é de um item por peso */
  modoVenda?: ModoVenda;
  pesosSugeridos?: number[];
  pesoMedioUn?: number;
}

/** Forma normalizada do que pode ir ao carrinho (vinda de Oferta ou Produto). */
export interface ItemCompravel {
  id: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  /** preço vigente por unidade de venda (un ou kg) */
  preco: number;
  precoNormal?: number;
  imagem?: string | number;
  modoVenda: ModoVenda;
  pesosSugeridos?: number[];
  pesoMedioUn?: number;
}

/** Aviso de destaque exibido ao abrir o app (ex.: horário especial de feriado). */
export interface Aviso {
  id: string;
  ativo: boolean;
  titulo: string;
  subtitulo?: string;
  /** Linhas do corpo, ex.: ["Sexta 07/09", "Das 6h às 12h"] */
  linhas: string[];
  destaque?: string; // texto grande, ex.: "DAS 6H ÀS 12H"
  rodape?: string;
  /** Telefone/WhatsApp do televendas, só dígitos com DDI/DDD (ex.: 5566...) */
  telefone?: string;
  /** Não mostrar de novo até esta data (ISO) */
  expira?: string;
}

export interface FormaPagamento {
  id: string;
  titulo: string;
  descricao: string;
  icone: string; // nome do Ionicons
  online: boolean; // aceito no app
  presencial: boolean; // aceito na loja/entrega
}

export interface NotificacaoItem {
  id: string;
  tipo: 'relampago' | 'oferta' | 'clube' | 'pedido';
  titulo: string;
  mensagem: string;
  data: string; // ISO datetime
  lida: boolean;
  ofertaId?: string;
}
