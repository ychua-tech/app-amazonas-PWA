import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { getAviso } from '../api/aviso';
import type { Aviso } from '../data/types';

const KEY = '@amazonas/aviso-visto';
const hojeStr = () => new Date().toISOString().slice(0, 10);

/**
 * Busca o aviso de abertura e decide se deve aparecer: uma vez por dia,
 * e não reaparece depois que o usuário fecha naquele dia.
 */
export function useAviso() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await getAviso();
      if (!a) return;
      setAviso(a);
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const visto = raw ? JSON.parse(raw) : null;
        if (!visto || visto.id !== a.id || visto.dia !== hojeStr()) {
          setVisivel(true);
        }
      } catch {
        setVisivel(true);
      }
    })();
  }, []);

  const fechar = useCallback(async () => {
    setVisivel(false);
    if (!aviso) return;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify({ id: aviso.id, dia: hojeStr() }));
    } catch {
      // ignora
    }
  }, [aviso]);

  return { aviso, visivel, fechar };
}
