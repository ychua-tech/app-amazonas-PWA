import type { Pedido, StatusPedido } from '../api/pedidos';
import { totalDaLinha, type ItemCarrinho } from '../context/CarrinhoContext';
import { formatarPeso } from '../data/compravel';
import { formasPagamentoPedido, loja, type FormaPagamentoPedido } from '../data/loja';
import { abrirWhatsApp } from './contato';
import { brl } from './format';

export interface DadosEntrega {
  nome: string;
  telefone?: string;
  endereco: string;
  bairro?: string;
  referencia?: string;
  pagamento: FormaPagamentoPedido;
  trocoPara?: string;
  observacao?: string;
  cartaoClube?: string;
  cashbackUsado?: number;
}

/** Monta o texto do pedido que vai para o WhatsApp do mercado. */
export function montarMensagemPedido(
  itens: ItemCarrinho[],
  dados: DadosEntrega,
  codigo?: string,
): string {
  const linhas: string[] = [];
  linhas.push(`*Novo pedido — ${loja.nome} (App)*`);
  if (codigo) {
    linhas.push(
      `Código: *${codigo}*`,
      '_Ao confirmar aqui, atualize o status no painel — o cliente acompanha pelo app._',
    );
  }
  linhas.push('');

  linhas.push('*Itens:*');
  let subtotal = 0;
  for (const item of itens) {
    const total = totalDaLinha(item);
    subtotal += total;
    if (item.modo === 'peso') {
      const porcao = `${item.quantidade > 1 ? `${item.quantidade}x ` : ''}≈${formatarPeso(item.pesoKg ?? 0)}`;
      linhas.push(
        `• ${item.nome} — ${porcao} a ${brl(item.preco)}/kg ≈ ${brl(total)}`,
      );
    } else {
      linhas.push(
        `• ${item.quantidade}x ${item.nome} (${item.unidade}) — ${brl(item.preco)} = ${brl(total)}`,
      );
    }
  }
  linhas.push('', `Subtotal estimado: ${brl(subtotal)}`);
  if (dados.cashbackUsado && dados.cashbackUsado > 0) {
    linhas.push(`Cashback do Clube: -${brl(dados.cashbackUsado)}`);
  }
  const total = subtotal - (dados.cashbackUsado ?? 0);
  linhas.push(`*Total: ${brl(total)}*`);
  linhas.push('_Taxa de entrega a combinar. Preços conforme o app, sujeitos a conferência na loja._', '');

  linhas.push('*Entrega:*');
  linhas.push(`Nome: ${dados.nome}`);
  if (dados.telefone) linhas.push(`Telefone: ${dados.telefone}`);
  linhas.push(`Endereço: ${dados.endereco}`);
  if (dados.bairro) linhas.push(`Bairro: ${dados.bairro}`);
  if (dados.referencia) linhas.push(`Referência: ${dados.referencia}`);
  if (dados.cartaoClube) linhas.push(`Clube Amazonas: ${dados.cartaoClube}`);

  const pgto =
    formasPagamentoPedido.find((f) => f.id === dados.pagamento)?.rotulo ??
    dados.pagamento;
  linhas.push('', `*Pagamento:* ${pgto}`);
  if (dados.pagamento === 'dinheiro' && dados.trocoPara) {
    linhas.push(`Troco para: ${dados.trocoPara}`);
  }
  if (dados.observacao) linhas.push('', `*Observação:* ${dados.observacao}`);

  return linhas.join('\n');
}

export async function enviarPedidoWhatsApp(
  itens: ItemCarrinho[],
  dados: DadosEntrega,
  codigo?: string,
) {
  await abrirWhatsApp(loja.whatsappPedidos, montarMensagemPedido(itens, dados, codigo));
}

/** Texto pra avisar o cliente no WhatsApp quando o status do pedido muda. */
const MENSAGENS_STATUS: Partial<Record<StatusPedido, (p: Pedido) => string>> = {
  aceito: (p) =>
    `Oi, ${p.cliente.nome}! Seu pedido *${p.codigo}* do ${loja.nome} foi confirmado ✅ Já começamos a separar.`,
  separando: (p) => `Seu pedido *${p.codigo}* está sendo separado agora 🛒`,
  saiu_entrega: (p) => `Seu pedido *${p.codigo}* saiu para entrega 🛵 Já já chega aí!`,
  entregue: (p) => `Seu pedido *${p.codigo}* foi entregue 🎉 Obrigado por comprar no ${loja.nome}!`,
  cancelado: (p) => `Seu pedido *${p.codigo}* foi cancelado. Qualquer dúvida, é só chamar por aqui.`,
};

/**
 * Abre o WhatsApp do cliente (com a mensagem do novo status já escrita) pra dona só apertar enviar.
 * Não faz nada se o cliente não deixou telefone, ou se o status não tem aviso (ex.: "aguardando").
 * Retorna `true` se abriu o WhatsApp.
 */
export async function avisarStatusWhatsApp(pedido: Pedido, status: StatusPedido): Promise<boolean> {
  const telefone = pedido.cliente.telefone;
  const mensagem = MENSAGENS_STATUS[status]?.(pedido);
  if (!telefone || !mensagem) return false;
  await abrirWhatsApp(telefone, mensagem);
  return true;
}
