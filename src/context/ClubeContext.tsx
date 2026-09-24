import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loja } from '../data/loja';
import { ehAniversarioHoje, parseAniversario } from '../lib/aniversario';
import { lerQrNotaFiscal, notaEhDaLoja } from '../lib/nfe';

export interface NotaRegistrada {
  chave: string;
  numero: string;
  emissao: string;
  valor?: number;
  /** cashback creditado por esta nota (R$); 0 quando o valor não veio no QR */
  cashback: number;
  registradaEm: string;
}

/** Movimento de cashback que não vem de nota (bônus, uso em pedido, estorno). */
export interface MovimentoCashback {
  id: string;
  tipo: 'bonus' | 'uso' | 'estorno';
  descricao: string;
  /** positivo credita, negativo debita */
  valor: number;
  em: string;
}

export interface Socio {
  nome: string;
  cpf: string;
  telefone: string;
  /** número do cartão fidelidade (gerado no cadastro) */
  cartao: string;
  desde: string; // ISO date
  /** dia e mês do aniversário ("MM-DD") — base do bônus de aniversário; definido uma vez só */
  aniversario?: string;
  /** quando o bônus de aniversário foi usado pela última vez (vale 1x por ano) */
  bonusAniversarioUsadoEm?: string;
  notas: NotaRegistrada[];
  movimentos: MovimentoCashback[];
}

export interface StatusAniversario {
  /** "MM-DD", ou undefined se o sócio ainda não informou */
  data?: string;
  /** hoje é o dia do aniversário */
  hoje: boolean;
  /** o bônus deste ano já foi usado */
  usadoEsteAno: boolean;
}

/** Cashback de uma nota: % do valor. Sem valor no QR, fica 0 (ajuste depois pelo backend). */
function cashbackDaNota(valor?: number): number {
  if (!valor || valor <= 0) return 0;
  return Math.round(valor * (loja.cashbackPercentual / 100) * 100) / 100;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const uid = () => Math.random().toString(36).slice(2, 10);

export type ResultadoScan =
  | { ok: true; nota: NotaRegistrada }
  | { ok: false; erro: string };

interface ClubeState {
  carregando: boolean;
  socio: Socio | null;
  /** saldo de cashback disponível (R$) */
  cashback: number;
  /** total gasto (soma dos valores conhecidos de notas) */
  totalGasto: number;
  /** extrato: notas + movimentos, mais recentes primeiro */
  extrato: ExtratoItem[];
  aniversario: StatusAniversario;
  entrar: (dados: { nome: string; cpf: string; telefone: string; aniversario?: string }) => Promise<void>;
  sair: () => Promise<void>;
  /** informa o aniversário ("15/03"); só aceita uma vez (não dá pra trocar depois) */
  definirAniversario: (txt: string) => Promise<{ ok: true } | { ok: false; erro: string }>;
  /** valor do bônus de aniversário que vale AGORA nessa compra (0 = não vale) */
  bonusAniversarioDisponivel: (subtotal: number) => number;
  /** marca o bônus deste ano como usado */
  usarBonusAniversario: () => Promise<void>;
  registrarNotaFiscal: (conteudoQr: string) => Promise<ResultadoScan>;
  usarCashback: (valor: number, descricao: string) => Promise<boolean>;
  estornarCashback: (valor: number, descricao: string) => Promise<void>;
}

export interface ExtratoItem {
  id: string;
  em: string;
  titulo: string;
  detalhe?: string;
  valor: number; // + credita, - debita
}

const STORAGE_KEY = '@amazonas/socio';
const ClubeContext = createContext<ClubeState | undefined>(undefined);

function gerarCartao(cpf: string): string {
  const base = cpf.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `7891 ${base} ${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ClubeProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [socio, setSocio] = useState<Socio | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw) as Partial<Socio>;
          setSocio({ notas: [], movimentos: [], ...s } as Socio);
        }
      } catch {
        // ignora — segue deslogado
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const persistir = useCallback(async (s: Socio | null) => {
    setSocio(s);
    if (s) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const entrar = useCallback(
    async (dados: { nome: string; cpf: string; telefone: string; aniversario?: string }) => {
      // v1: cadastro local. Depois isso chama a API do Clube Amazonas.
      const agora = new Date().toISOString();
      await persistir({
        nome: dados.nome.trim(),
        cpf: dados.cpf,
        telefone: dados.telefone,
        cartao: gerarCartao(dados.cpf),
        desde: agora,
        aniversario: (dados.aniversario && parseAniversario(dados.aniversario)) || undefined,
        notas: [],
        movimentos: [],
      });
    },
    [persistir],
  );

  const sair = useCallback(() => persistir(null), [persistir]);

  // Preenche um sócio de demonstração com saldo (só com EXPO_PUBLIC_DEMO_SOCIO=1)
  useEffect(() => {
    if (carregando || socio) return;
    if (process.env.EXPO_PUBLIC_DEMO_SOCIO !== '1') return;
    const antes = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
    persistir({
      nome: 'Ana Paula Ribeiro',
      cpf: '12345678900',
      telefone: '66999990000',
      cartao: gerarCartao('12345678900'),
      desde: antes(720),
      notas: [
        {
          chave: '5'.repeat(44),
          numero: '84213',
          emissao: antes(48),
          valor: 187.4,
          cashback: 1.87,
          registradaEm: antes(48),
        },
        {
          chave: '4'.repeat(44),
          numero: '83990',
          emissao: antes(240),
          valor: 92.1,
          cashback: 0.92,
          registradaEm: antes(240),
        },
      ],
      movimentos: [
        { id: uid(), tipo: 'uso', descricao: 'Usado no pedido AMZ-4821', valor: -12, em: antes(60) },
      ],
    });
  }, [carregando, socio, persistir]);

  const registrarNotaFiscal = useCallback(
    async (conteudoQr: string): Promise<ResultadoScan> => {
      if (!socio) return { ok: false, erro: 'Entre no Clube primeiro.' };

      const lida = lerQrNotaFiscal(conteudoQr);
      if (!lida) {
        return { ok: false, erro: 'Não reconheci esse QR Code. Aponte para o QR da nota fiscal.' };
      }
      if (!notaEhDaLoja(lida)) {
        return { ok: false, erro: 'Essa nota não é de uma loja do Supermercado Amazonas.' };
      }
      if (socio.notas.some((n) => n.chave === lida.chave)) {
        return { ok: false, erro: 'Essa nota fiscal já foi registrada.' };
      }

      const nota: NotaRegistrada = {
        chave: lida.chave,
        numero: lida.numero,
        emissao: lida.emissao,
        valor: lida.valor,
        cashback: cashbackDaNota(lida.valor),
        registradaEm: new Date().toISOString(),
      };
      await persistir({ ...socio, notas: [nota, ...socio.notas] });
      return { ok: true, nota };
    },
    [socio, persistir],
  );

  const usarCashback = useCallback(
    async (valor: number, descricao: string): Promise<boolean> => {
      if (!socio || valor <= 0) return false;
      const saldo = calcularSaldo(socio);
      if (valor > saldo + 0.001) return false;
      await persistir({
        ...socio,
        movimentos: [
          { id: uid(), tipo: 'uso', descricao, valor: -round2(valor), em: new Date().toISOString() },
          ...socio.movimentos,
        ],
      });
      return true;
    },
    [socio, persistir],
  );

  const estornarCashback = useCallback(
    async (valor: number, descricao: string) => {
      if (!socio || valor <= 0) return;
      await persistir({
        ...socio,
        movimentos: [
          { id: uid(), tipo: 'estorno', descricao, valor: round2(valor), em: new Date().toISOString() },
          ...socio.movimentos,
        ],
      });
    },
    [socio, persistir],
  );

  const definirAniversario = useCallback(
    async (txt: string) => {
      if (!socio) return { ok: false as const, erro: 'Entre no Clube primeiro.' };
      if (socio.aniversario) return { ok: false as const, erro: 'O aniversário já foi informado e não pode ser alterado.' };
      const mmdd = parseAniversario(txt);
      if (!mmdd) return { ok: false as const, erro: 'Data inválida. Use dia e mês, ex.: 15/03.' };
      await persistir({ ...socio, aniversario: mmdd });
      return { ok: true as const };
    },
    [socio, persistir],
  );

  const bonusAniversarioDisponivel = useCallback(
    (subtotal: number) => {
      if (!socio || !ehAniversarioHoje(socio.aniversario)) return 0;
      const usadoEm = socio.bonusAniversarioUsadoEm;
      if (usadoEm && new Date(usadoEm).getFullYear() === new Date().getFullYear()) return 0;
      if (round2(subtotal) < loja.bonusAniversario.compraMinima) return 0;
      return loja.bonusAniversario.valor;
    },
    [socio],
  );

  const usarBonusAniversario = useCallback(async () => {
    if (!socio) return;
    await persistir({ ...socio, bonusAniversarioUsadoEm: new Date().toISOString() });
  }, [socio, persistir]);

  const value = useMemo<ClubeState>(() => {
    const notas = socio?.notas ?? [];
    const movimentos = socio?.movimentos ?? [];

    const extrato: ExtratoItem[] = [
      ...notas.map((n) => ({
        id: n.chave,
        em: n.registradaEm,
        titulo: `Nota fiscal ${n.numero}`,
        detalhe: n.valor
          ? `Compra de ${n.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : 'Valor pendente de conferência',
        valor: n.cashback,
      })),
      ...movimentos.map((m) => ({
        id: m.id,
        em: m.em,
        titulo: m.descricao,
        valor: m.valor,
      })),
    ].sort((a, b) => +new Date(b.em) - +new Date(a.em));

    return {
      carregando,
      socio,
      aniversario: {
        data: socio?.aniversario,
        hoje: ehAniversarioHoje(socio?.aniversario),
        usadoEsteAno:
          !!socio?.bonusAniversarioUsadoEm &&
          new Date(socio.bonusAniversarioUsadoEm).getFullYear() === new Date().getFullYear(),
      },
      cashback: socio ? calcularSaldo(socio) : 0,
      totalGasto: notas.reduce((s, n) => s + (n.valor ?? 0), 0),
      extrato,
      entrar,
      sair,
      definirAniversario,
      bonusAniversarioDisponivel,
      usarBonusAniversario,
      registrarNotaFiscal,
      usarCashback,
      estornarCashback,
    };
  }, [
    carregando,
    socio,
    entrar,
    sair,
    definirAniversario,
    bonusAniversarioDisponivel,
    usarBonusAniversario,
    registrarNotaFiscal,
    usarCashback,
    estornarCashback,
  ]);

  return <ClubeContext.Provider value={value}>{children}</ClubeContext.Provider>;
}

function calcularSaldo(s: Socio): number {
  const deNotas = s.notas.reduce((acc, n) => acc + n.cashback, 0);
  const deMovimentos = s.movimentos.reduce((acc, m) => acc + m.valor, 0);
  return Math.max(0, round2(deNotas + deMovimentos));
}

export function useClube(): ClubeState {
  const ctx = useContext(ClubeContext);
  if (!ctx) throw new Error('useClube precisa estar dentro de <ClubeProvider>');
  return ctx;
}
