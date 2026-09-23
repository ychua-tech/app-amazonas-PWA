import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Categoria, ItemCompravel } from '../data/types';

export interface ItemCarrinho {
  /** chave da linha (produtoId + modo + peso) */
  linhaId: string;
  produtoId: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  imagem?: string | number;
  /** preço por unidade de venda (un ou kg) */
  preco: number;
  precoNormal?: number;
  modo: 'unidade' | 'peso';
  /** nº de unidades (modo unidade) ou nº de porções (modo peso, quase sempre 1) */
  quantidade: number;
  /** modo peso: kg escolhido por porção */
  pesoKg?: number;
}

export interface OpcoesAdicionar {
  modo?: 'unidade' | 'peso';
  pesoKg?: number;
  quantidade?: number;
  /** sobrescreve o preço da linha (ex.: hortifruti por unidade = preço/kg × peso médio) */
  precoUnitario?: number;
  /** rótulo da unidade na linha (ex.: "un (≈130 g)") */
  rotuloUnidade?: string;
}

interface CarrinhoState {
  itens: ItemCarrinho[];
  /** nº de linhas no carrinho (para o badge) */
  totalItens: number;
  /** valor total (preço × qtd, ou preço/kg × peso × qtd) */
  subtotal: number;
  /** quantidade total de um produto (soma das linhas) */
  quantidadeDe: (produtoId: string) => number;
  totalLinha: (item: ItemCarrinho) => number;
  adicionar: (base: ItemCompravel, opcoes?: OpcoesAdicionar) => void;
  definirQuantidade: (linhaId: string, qtd: number) => void;
  definirPeso: (linhaId: string, pesoKg: number) => void;
  remover: (linhaId: string) => void;
  limpar: () => void;
}

const STORAGE_KEY = '@amazonas/carrinho/v2';
const CarrinhoContext = createContext<CarrinhoState | undefined>(undefined);

export function totalDaLinha(item: ItemCarrinho): number {
  const base = item.modo === 'peso' ? item.preco * (item.pesoKg ?? 0) : item.preco;
  return Math.round(base * item.quantidade * 100) / 100;
}

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItens(JSON.parse(raw));
      } catch {
        // ignora
      } finally {
        setPronto(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!pronto) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itens)).catch(() => {});
  }, [itens, pronto]);

  const adicionar = useCallback((base: ItemCompravel, opcoes: OpcoesAdicionar = {}) => {
    const modo: 'unidade' | 'peso' =
      opcoes.modo ?? (base.modoVenda === 'peso' ? 'peso' : 'unidade');
    const qtd = opcoes.quantidade ?? 1;
    const pesoKg =
      modo === 'peso'
        ? opcoes.pesoKg ?? base.pesosSugeridos?.[0] ?? 1
        : undefined;
    const preco = opcoes.precoUnitario ?? base.preco;
    const unidade = opcoes.rotuloUnidade ?? base.unidade;
    const linhaId = `${base.id}|${modo}|${pesoKg ?? unidade}`;

    setItens((prev) => {
      const i = prev.findIndex((x) => x.linhaId === linhaId);
      if (i >= 0) {
        const copia = [...prev];
        copia[i] = { ...copia[i], quantidade: copia[i].quantidade + qtd };
        return copia;
      }
      return [
        ...prev,
        {
          linhaId,
          produtoId: base.id,
          nome: base.nome,
          categoria: base.categoria,
          unidade,
          imagem: base.imagem,
          preco,
          precoNormal: base.precoNormal,
          modo,
          quantidade: qtd,
          pesoKg,
        },
      ];
    });
  }, []);

  const definirQuantidade = useCallback((linhaId: string, qtd: number) => {
    setItens((prev) =>
      qtd <= 0
        ? prev.filter((x) => x.linhaId !== linhaId)
        : prev.map((x) => (x.linhaId === linhaId ? { ...x, quantidade: qtd } : x)),
    );
  }, []);

  const definirPeso = useCallback((linhaId: string, pesoKg: number) => {
    setItens((prev) =>
      prev.map((x) =>
        x.linhaId === linhaId
          ? { ...x, pesoKg, linhaId: `${x.produtoId}|peso|${pesoKg}` }
          : x,
      ),
    );
  }, []);

  const remover = useCallback((linhaId: string) => {
    setItens((prev) => prev.filter((x) => x.linhaId !== linhaId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const value = useMemo<CarrinhoState>(() => {
    const subtotal =
      Math.round(itens.reduce((s, x) => s + totalDaLinha(x), 0) * 100) / 100;
    return {
      itens,
      totalItens: itens.length,
      subtotal,
      quantidadeDe: (produtoId) =>
        itens
          .filter((x) => x.produtoId === produtoId)
          .reduce((s, x) => s + x.quantidade, 0),
      totalLinha: totalDaLinha,
      adicionar,
      definirQuantidade,
      definirPeso,
      remover,
      limpar,
    };
  }, [itens, adicionar, definirQuantidade, definirPeso, remover, limpar]);

  return (
    <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>
  );
}

export function useCarrinho(): CarrinhoState {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>');
  return ctx;
}
