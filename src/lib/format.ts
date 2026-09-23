export function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function descontoPercent(normal: number, oferta: number): number {
  if (normal <= 0) return 0;
  return Math.round(((normal - oferta) / normal) * 100);
}

/** "termina em 2h 15min" / "termina em 45min" a partir de ms restantes */
export function restanteDeMs(ms: number): string {
  if (ms <= 0) return 'encerrada';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h > 0) return `termina em ${h}h ${min}min`;
  if (min > 0) return `termina em ${min}min`;
  return 'últimos segundos';
}

/** "termina em 2h 15min" / "termina em 45min" */
export function tempoRestante(fimISO: string): string {
  return restanteDeMs(new Date(fimISO).getTime() - Date.now());
}

/** "válida até 10/09" */
export function validadeCurta(iso: string): string {
  const d = new Date(iso);
  return `válida até ${d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })}`;
}

/** "há 12 min" / "há 2 h" / "ontem" */
export function tempoAtras(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}
