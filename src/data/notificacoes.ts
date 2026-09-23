import type { NotificacaoItem } from './types';

const min = (m: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - m);
  return d.toISOString();
};

/** Mock do histórico de notificações recebidas. Na v1 real vem do backend. */
export const notificacoesIniciais: NotificacaoItem[] = [
  {
    id: 'nt-01',
    tipo: 'relampago',
    titulo: '⚡ Oferta relâmpago: Café Tanserra 500g',
    mensagem: 'De R$ 30,49 por R$ 24,99 — só até o meio-dia ou enquanto durar o estoque.',
    data: min(12),
    lida: false,
    ofertaId: 'of-111',
  },
  {
    id: 'nt-02',
    tipo: 'relampago',
    titulo: '⚡ Morango bandeja 250g por R$ 16,99',
    mensagem: 'Quantidade limitada no hortifruti. Corre que acaba rápido!',
    data: min(90),
    lida: false,
    ofertaId: 'of-129',
  },
  {
    id: 'nt-03',
    tipo: 'clube',
    titulo: 'Você economizou R$ 38,40 este mês',
    mensagem: 'Com o preço de sócio do Clube Amazonas. Continue aproveitando!',
    data: min(300),
    lida: true,
  },
  {
    id: 'nt-04',
    tipo: 'oferta',
    titulo: 'Ofertão da Independência no Açougue',
    mensagem: 'Coxão mole por R$ 43,99/kg — R$ 41,99 para sócios.',
    data: min(1440),
    lida: true,
    ofertaId: 'of-123',
  },
];
