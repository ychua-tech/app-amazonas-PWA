import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getProdutos } from '../api/produtos';
import { catalogoSeed } from '../data/catalogo';
import type { Produto } from '../data/types';

interface CatalogoState {
  produtos: Produto[];
  carregando: boolean;
  erro: string | null;
  /** rebusca o catálogo na API (usado no pull-to-refresh e depois de editar preços no admin) */
  refresh: () => Promise<void>;
}

const CatalogoContext = createContext<CatalogoState | undefined>(undefined);

export function CatalogoProvider({ children }: { children: React.ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(catalogoSeed);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const lista = await getProdutos();
      setProdutos(lista);
      setErro(null);
    } catch {
      setErro('Não foi possível atualizar o catálogo.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const value = useMemo<CatalogoState>(
    () => ({ produtos, carregando, erro, refresh: carregar }),
    [produtos, carregando, erro, carregar],
  );

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo(): CatalogoState {
  const ctx = useContext(CatalogoContext);
  if (!ctx) throw new Error('useCatalogo precisa estar dentro de <CatalogoProvider>');
  return ctx;
}
