import type { Aviso } from './types';

/**
 * Aviso exibido ao abrir o app (1x por dia). Em produção vem da API (GET /aviso),
 * editável pelo painel admin — a equipe troca por comunicados de feriado quando precisar.
 */
export const avisoAtual: Aviso = {
  id: 'horario-funcionamento',
  ativo: true,
  titulo: 'Horário de funcionamento',
  subtitulo: 'O preferido da família juinense está sempre pertinho de você',
  linhas: ['Segunda a sábado: 6h às 20h', 'Domingos: 6h às 12h'],
  rodape: 'Prefere receber em casa? Peça pelo nosso televendas ou monte a lista aqui no app.',
  telefone: '556635662298',
};
