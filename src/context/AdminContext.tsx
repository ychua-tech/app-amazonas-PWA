import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { adminFetch } from '../api/admin';
import { ApiError } from '../api/http';
import { apagar, guardar, ler } from '../lib/cofre';

// expo-secure-store só aceita chaves com [A-Za-z0-9._-] — nada de "@" ou "/".
const CHAVE_TOKEN = 'amazonas_admin_token';
const CHAVE_PIN = 'amazonas_admin_pin';

interface AdminState {
  /** ainda lendo o cofre */
  carregando: boolean;
  /** token salvo (null = precisa fazer login) */
  token: string | null;
  /** tem token E já passou pelo PIN (se houver) */
  autenticado: boolean;
  /** tem token, tem PIN, mas ainda não desbloqueou nesta sessão */
  bloqueado: boolean;
  temPin: boolean;
  /** valida o token no servidor e salva. Lança ApiError se não bater. */
  entrar: (token: string) => Promise<void>;
  definirPin: (pin: string) => Promise<void>;
  removerPin: () => Promise<void>;
  /** true se o PIN conferir */
  desbloquear: (pin: string) => Promise<boolean>;
  sair: () => Promise<void>;
  /** chamada autenticada às rotas /admin/* */
  req: <T>(path: string, init?: RequestInit) => Promise<T>;
}

const AdminContext = createContext<AdminState | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, p] = await Promise.all([ler(CHAVE_TOKEN), ler(CHAVE_PIN)]);
      setToken(t);
      setPin(p);
      setBloqueado(!!t && !!p);
      setCarregando(false);
    })();
  }, []);

  const sair = useCallback(async () => {
    await Promise.all([apagar(CHAVE_TOKEN), apagar(CHAVE_PIN)]);
    setToken(null);
    setPin(null);
    setBloqueado(false);
  }, []);

  const entrar = useCallback(async (novo: string) => {
    const limpo = novo.trim();
    await adminFetch('/admin/ping', limpo); // lança ApiError se inválido
    await guardar(CHAVE_TOKEN, limpo);
    setToken(limpo);
    setBloqueado(false);
  }, []);

  const definirPin = useCallback(async (novo: string) => {
    await guardar(CHAVE_PIN, novo);
    setPin(novo);
    setBloqueado(false);
  }, []);

  const removerPin = useCallback(async () => {
    await apagar(CHAVE_PIN);
    setPin(null);
    setBloqueado(false);
  }, []);

  const desbloquear = useCallback(
    async (tentativa: string) => {
      if (pin && tentativa === pin) {
        setBloqueado(false);
        return true;
      }
      return false;
    },
    [pin],
  );

  const req = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      if (!token) throw new ApiError('Sessão expirada', 401);
      try {
        return await adminFetch<T>(path, token, init);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await sair();
        throw e;
      }
    },
    [token, sair],
  );

  const value = useMemo<AdminState>(
    () => ({
      carregando,
      token,
      autenticado: !!token && !bloqueado,
      bloqueado: !!token && bloqueado,
      temPin: !!pin,
      entrar,
      definirPin,
      removerPin,
      desbloquear,
      sair,
      req,
    }),
    [carregando, token, bloqueado, pin, entrar, definirPin, removerPin, desbloquear, sair, req],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin precisa estar dentro de <AdminProvider>');
  return ctx;
}
