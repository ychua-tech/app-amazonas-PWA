import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const KEY = '@amazonas/instalar-app-dispensado';

/** Evento não-padrão do Chrome/Edge/Android — não faz parte do lib.dom.d.ts do TS. */
interface EventoInstalarPWA extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function rodandoInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneIOS = (window.navigator as { standalone?: boolean }).standalone === true;
  return standaloneIOS || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function ehIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && safari;
}

/**
 * Controla o banner de "instalar o app" na versão web (PWA).
 * - Chrome/Edge/Android: captura o `beforeinstallprompt` e expõe `instalar()`.
 * - iOS Safari: não existe esse evento — expõe `modoManualIOS` pra mostrar o passo a passo.
 * - Nativo (iOS/Android via app instalado) e já instalado como PWA: não faz nada.
 */
export function useInstalarApp() {
  const [evento, setEvento] = useState<EventoInstalarPWA | null>(null);
  const [modoManualIOS, setModoManualIOS] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || rodandoInstalado()) return;

    let cancelado = false;
    (async () => {
      try {
        const dispensado = await AsyncStorage.getItem(KEY);
        if (dispensado || cancelado) return;
        if (ehIOSSafari()) {
          setModoManualIOS(true);
          setVisivel(true);
        }
      } catch {
        // sem storage, segue sem mostrar
      }
    })();

    const aoFicarInstalavel = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalarPWA);
      AsyncStorage.getItem(KEY).then((dispensado) => {
        if (!dispensado) setVisivel(true);
      });
    };
    const aoInstalar = () => {
      setVisivel(false);
      setEvento(null);
    };

    window.addEventListener('beforeinstallprompt', aoFicarInstalavel);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      cancelado = true;
      window.removeEventListener('beforeinstallprompt', aoFicarInstalavel);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null);
    setVisivel(false);
    if (outcome === 'accepted') {
      await AsyncStorage.setItem(KEY, '1').catch(() => {});
    }
  }, [evento]);

  const dispensar = useCallback(() => {
    setVisivel(false);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  }, []);

  return { visivel, modoManualIOS, podeInstalar: !!evento, instalar, dispensar };
}
