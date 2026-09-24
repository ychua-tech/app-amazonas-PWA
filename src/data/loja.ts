/** Dados da loja usados em contato, pedido por WhatsApp e rodapés. */
export const loja = {
  nome: 'Supermercado Amazonas',
  /** WhatsApp que recebe os pedidos — só dígitos, com DDI 55 + DDD */
  whatsappPedidos: '556635662298',
  telefone: '556635662298',
  instagram: 'amazonasjuina',
  endereco: 'Avenida das Arapongas, 280N — Módulo 04, Juína-MT',
  /**
   * CNPJs das lojas Amazonas (matriz + filiais), só dígitos.
   * Garante que o cashback só conta para nota do Amazonas.
   */
  cnpjs: ['36901718000104'] as string[],
  /** % de cashback sobre o valor da nota fiscal */
  cashbackPercentual: 1,
  /** Pedido mínimo para entrega (R$); 0 = sem mínimo */
  pedidoMinimo: 0,
  /** Entrega grátis quando os itens somam este valor ou mais (R$). Espelhado em server/index.js */
  entregaGratisAPartirDe: 100,
  /** Taxa de entrega cobrada abaixo do valor acima (R$). Espelhado em server/index.js */
  taxaEntrega: 10,
  /**
   * Bônus do Clube: só vale no dia do aniversário do sócio, uma vez por ano,
   * em compras a partir de `compraMinima`. Espelhado em server/index.js.
   */
  bonusAniversario: { valor: 10, compraMinima: 200 },
};

export const formasPagamentoPedido = [
  { id: 'pix', rotulo: 'Pix (pago quando confirmarmos o pedido)' },
  { id: 'dinheiro', rotulo: 'Dinheiro na entrega' },
  { id: 'cartao', rotulo: 'Cartão na maquininha (entrega)' },
] as const;

export type FormaPagamentoPedido = (typeof formasPagamentoPedido)[number]['id'];
