import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ATIVA } from './config';
import { apiFetch } from './http';
import { getPushTokenSalvo } from '../lib/notifications';

export type StatusPedido =
  | 'aguardando'
  | 'aceito'
  | 'separando'
  | 'saiu_entrega'
  | 'entregue'
  | 'cancelado';

export const FLUXO_PEDIDO: StatusPedido[] = [
  'aguardando',
  'aceito',
  'separando',
  'saiu_entrega',
  'entregue',
];

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  aguardando: 'Aguardando confirmação',
  aceito: 'Pedido confirmado',
  separando: 'Separando os itens',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export interface ItemPedido {
  nome: string;
  unidade: string;
  quantidade: number;
  precoOferta: number;
  modo?: 'unidade' | 'peso';
  /** modo peso: kg aproximado por porção */
  pesoKg?: number;
}

export interface Pedido {
  id: string;
  codigo: string;
  criadoEm: string;
  status: StatusPedido;
  historico: { status: StatusPedido; em: string }[];
  cliente: {
    nome: string;
    telefone?: string;
    endereco: string;
    bairro?: string;
    referencia?: string;
  };
  pagamento?: string | null;
  trocoPara?: string | null;
  observacao?: string | null;
  itens: ItemPedido[];
  subtotal: number;
  cashbackUsado?: number;
  /** subtotal - cashbackUsado (sem taxa de entrega) */
  total?: number;
  canceladoMotivo?: string;
  /** true quando é um pedido local (sem servidor) */
  demo?: boolean;
}

export interface NovoPedido {
  cliente: Pedido['cliente'];
  pagamento?: string;
  trocoPara?: string;
  observacao?: string;
  itens: ItemPedido[];
  subtotal: number;
  cashbackUsado?: number;
}

export interface PedidoResumo {
  id: string;
  codigo: string;
  criadoEm: string;
}

const chaveLocal = (id: string) => `@amazonas/pedido/${id}`;
const isLocal = (id: string) => id.startsWith('local-');

function gerarCodigo() {
  return 'AMZ-' + Math.floor(1000 + Math.random() * 9000);
}

/** Cria o pedido no servidor; sem servidor, cria um pedido local de demonstração. */
export async function criarPedido(dados: NovoPedido): Promise<PedidoResumo> {
  if (API_ATIVA) {
    const pushToken = await getPushTokenSalvo();
    const r = await apiFetch<{ id: string; codigo: string }>('/pedidos', {
      method: 'POST',
      body: JSON.stringify({ ...dados, pushToken }),
    });
    return { id: r.id, codigo: r.codigo, criadoEm: new Date().toISOString() };
  }

  // demo local
  const agora = new Date().toISOString();
  const pedido: Pedido = {
    id: 'local-' + Math.random().toString(36).slice(2, 10),
    codigo: gerarCodigo(),
    criadoEm: agora,
    status: 'aguardando',
    historico: [{ status: 'aguardando', em: agora }],
    cliente: dados.cliente,
    pagamento: dados.pagamento ?? null,
    trocoPara: dados.trocoPara ?? null,
    observacao: dados.observacao ?? null,
    itens: dados.itens,
    subtotal: dados.subtotal,
    cashbackUsado: dados.cashbackUsado,
    total: Math.round((dados.subtotal - (dados.cashbackUsado ?? 0)) * 100) / 100,
    demo: true,
  };
  await AsyncStorage.setItem(chaveLocal(pedido.id), JSON.stringify(pedido));
  return { id: pedido.id, codigo: pedido.codigo, criadoEm: agora };
}

export async function getPedido(id: string): Promise<Pedido | null> {
  if (isLocal(id)) {
    try {
      const raw = await AsyncStorage.getItem(chaveLocal(id));
      return raw ? (JSON.parse(raw) as Pedido) : null;
    } catch {
      return null;
    }
  }
  try {
    return await apiFetch<Pedido>(`/pedidos/${id}`);
  } catch {
    return null;
  }
}

/** Demonstração: avança o pedido local para o próximo status. */
export async function avancarPedidoLocal(id: string): Promise<Pedido | null> {
  if (!isLocal(id)) return null;
  const pedido = await getPedido(id);
  if (!pedido) return null;
  const i = FLUXO_PEDIDO.indexOf(pedido.status);
  if (i < 0 || i >= FLUXO_PEDIDO.length - 1) return pedido;
  const proximo = FLUXO_PEDIDO[i + 1];
  pedido.status = proximo;
  pedido.historico.push({ status: proximo, em: new Date().toISOString() });
  await AsyncStorage.setItem(chaveLocal(id), JSON.stringify(pedido));
  return pedido;
}

export function statusFinal(s: StatusPedido) {
  return s === 'entregue' || s === 'cancelado';
}
