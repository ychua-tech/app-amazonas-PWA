/**
 * Paleta oficial do app — Opção 1 ("Fiel à marca").
 * Laranja como cor de ação, neutros quentes para telas longas de compra.
 */
export const colors = {
  /** Botões, destaques, preço de oferta */
  primary: '#F26522',
  /** Estado pressionado, header, base do gradiente */
  primaryDark: '#D24E12',
  /** Ponta mais escura do gradiente (cartões, heros) */
  primaryDeep: '#B23C0A',
  /** Fundo suave do laranja (tags, chips) */
  primarySoft: '#FDE9DE',

  /** Texto principal */
  text: '#1A1A1A',
  /** Texto secundário / legendas */
  textMuted: '#6B6B6B',
  /** Texto terciário, bem apagado */
  textSubtle: '#9A948C',
  /** Texto sobre fundo laranja */
  onPrimary: '#FFFFFF',

  /** Fundo das telas */
  background: '#FBF8F4',
  /** Cards e superfícies elevadas */
  surface: '#F2EEE8',
  /** Branco puro (cards sobre surface) */
  card: '#FFFFFF',
  /** Bordas e divisórias */
  border: '#EBE5DC',
  /** Borda ainda mais sutil */
  borderSoft: '#F1ECE4',

  /** Pedido confirmado, sucesso */
  success: '#1F9D55',
  successSoft: '#E4F5EC',
  /** Oferta relâmpago, erro, urgência */
  danger: '#E03131',
  dangerSoft: '#FDECEC',
  /** Selo de economia, "preço sócio", cashback */
  accent: '#F5A524',
  accentSoft: '#FFF3DE',

  /** Cor do cashback (verde dinheiro) */
  cashback: '#0E9F6E',

  /** Scrim de modais */
  overlay: 'rgba(20, 12, 6, 0.55)',
} as const;

export type ColorName = keyof typeof colors;
