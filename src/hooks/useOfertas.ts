import { useCallback, useEffect, useState } from 'react';
import { getOfertas } from '../api/ofertas';
import type { Oferta } from '../data/types';

interface Estado {
  ofertas: Oferta[];
  carregando: boolean;
  atualizando: boolean;
  erro: string | null;
}

export function useOfertas() {
  const [estado, setEstado] = useState<Estado>({
    ofertas: [],
    carregando: true,
    atualizando: false,
    erro: null,
  });

  const carregar = useCallback(async (modo: 'inicial' | 'refresh') => {
    setEstado((s) => ({
      ...s,
      carregando: modo === 'inicial',
      atualizando: modo === 'refresh',
      erro: null,
    }));
    try {
      const lista = await getOfertas();
      setEstado({ ofertas: lista, carregando: false, atualizando: false, erro: null });
    } catch {
      setEstado((s) => ({
        ...s,
        carregando: false,
        atualizando: false,
        erro: 'Não foi possível carregar as ofertas.',
      }));
    }
  }, []);

  useEffect(() => {
    carregar('inicial');
  }, [carregar]);

  return {
    ...estado,
    refresh: () => carregar('refresh'),
  };
}

export function useOferta(id: string | undefined) {
  const { ofertas, carregando, erro } = useOfertas();
  return {
    oferta: id ? ofertas.find((o) => o.id === id) : undefined,
    carregando,
    erro,
  };
}
