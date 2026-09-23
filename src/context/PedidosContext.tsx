import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { criarPedido, type NovoPedido, type PedidoResumo } from '../api/pedidos';

const STORAGE_KEY = '@amazonas/meus-pedidos';

interface PedidosState {
  pedidos: PedidoResumo[];
  criar: (dados: NovoPedido) => Promise<PedidoResumo>;
  recarregar: () => Promise<void>;
}

const PedidosContext = createContext<PedidosState | undefined>(undefined);

export function PedidosProvider({ children }: { children: React.ReactNode }) {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);

  const recarregar = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setPedidos(raw ? JSON.parse(raw) : []);
    } catch {
      setPedidos([]);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const criar = useCallback(async (dados: NovoPedido) => {
    const resumo = await criarPedido(dados);
    setPedidos((prev) => {
      const lista = [resumo, ...prev].slice(0, 30);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista)).catch(() => {});
      return lista;
    });
    return resumo;
  }, []);

  const value = useMemo(
    () => ({ pedidos, criar, recarregar }),
    [pedidos, criar, recarregar],
  );

  return <PedidosContext.Provider value={value}>{children}</PedidosContext.Provider>;
}

export function usePedidos(): PedidosState {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error('usePedidos precisa estar dentro de <PedidosProvider>');
  return ctx;
}
