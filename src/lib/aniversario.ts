/**
 * Aniversário do sócio: só dia e mês (sem ano — não precisamos da idade).
 * Guardado como "MM-DD"; digitado/exibido como "DD/MM".
 */

const DIAS_DO_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // fevereiro aceita 29

const dois = (n: number) => String(n).padStart(2, '0');

/** "15/03", "15-3", "1503" → "03-15". Inválido → null. */
export function parseAniversario(txt: string): string | null {
  const t = txt.trim();
  const m = t.match(/^(\d{1,2})\s*[/\-.\s]\s*(\d{1,2})$/) ?? t.match(/^(\d{2})(\d{2})$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > DIAS_DO_MES[mes - 1]) return null;
  return `${dois(mes)}-${dois(dia)}`;
}

/** "03-15" → "15/03" */
export function formatarAniversario(mmdd: string): string {
  const [mes, dia] = mmdd.split('-');
  return `${dia}/${mes}`;
}

/** Hoje (no horário do aparelho) é o dia do aniversário? */
export function ehAniversarioHoje(mmdd: string | undefined, hoje: Date = new Date()): boolean {
  return !!mmdd && mmdd === `${dois(hoje.getMonth() + 1)}-${dois(hoje.getDate())}`;
}
