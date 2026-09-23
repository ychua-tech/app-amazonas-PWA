import { loja } from '../data/loja';

export interface NotaFiscalLida {
  /** chave de acesso da NFC-e (44 dígitos) */
  chave: string;
  /** CNPJ do emitente (14 dígitos) extraído da chave */
  cnpjEmitente: string;
  /** data de emissão aproximada (AAMM da chave) */
  emissao: string; // ISO (dia 1 do mês)
  /** valor total, quando o QR traz vNF (nota emitida offline); senão undefined */
  valor?: number;
  /** número da nota */
  numero: string;
  /** URL original do QR */
  url: string;
}

const soDigitos = (s: string) => s.replace(/\D/g, '');

/**
 * Lê o conteúdo do QR Code de uma NFC-e (nota fiscal do consumidor).
 * Aceita a URL completa da SEFAZ ou só a chave de 44 dígitos.
 * Retorna null se não reconhecer.
 */
export function lerQrNotaFiscal(conteudo: string): NotaFiscalLida | null {
  if (!conteudo) return null;
  const texto = conteudo.trim();

  let param = texto;
  try {
    const url = new URL(texto);
    param = url.searchParams.get('p') ?? texto;
  } catch {
    // não é URL — pode ser só a chave ou o "p" cru
  }

  const partes = param.split('|');
  const chave = soDigitos(partes[0] ?? param);
  if (chave.length !== 44) return null;

  const ano = 2000 + Number(chave.slice(2, 4));
  const mes = Number(chave.slice(4, 6));
  const emissao = new Date(Date.UTC(ano, Math.max(0, mes - 1), 1)).toISOString();
  const cnpjEmitente = chave.slice(6, 20);
  const numero = chave.slice(25, 34).replace(/^0+/, '') || '0';

  // vNF só existe em QR de nota emitida offline (contingência)
  let valor: number | undefined;
  if (partes.length >= 6) {
    const v = Number(partes[4]);
    if (Number.isFinite(v) && v > 0) valor = v;
  }

  return {
    chave,
    cnpjEmitente,
    emissao,
    valor,
    numero,
    url: texto,
  };
}

/**
 * A nota é de uma loja do Supermercado Amazonas?
 * Enquanto `loja.cnpjs` estiver vazio, aceita qualquer nota (modo demonstração).
 * Preencha os CNPJs reais para o cashback valer só nas lojas do Amazonas.
 */
export function notaEhDaLoja(nota: NotaFiscalLida): boolean {
  const cnpjs = (loja.cnpjs ?? []).map(soDigitos).filter((c) => c.length === 14);
  if (cnpjs.length === 0) return true;
  return cnpjs.includes(nota.cnpjEmitente);
}

/** true quando ainda não há CNPJ configurado (cashback em modo demonstração). */
export function cashbackEmDemonstracao(): boolean {
  return (loja.cnpjs ?? []).map(soDigitos).filter((c) => c.length === 14).length === 0;
}
