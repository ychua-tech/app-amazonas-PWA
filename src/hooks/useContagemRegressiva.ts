import { useEffect, useState } from 'react';

/**
 * Recalcula o tempo restante a cada `intervaloMs` (padrão 1 min) para o
 * contador das ofertas relâmpago ficar vivo na tela.
 */
export function useContagemRegressiva(fimISO?: string, intervaloMs = 60_000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!fimISO) return;
    const t = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(t);
  }, [fimISO, intervaloMs]);

  if (!fimISO) return { restanteMs: null, encerrada: false };

  const restanteMs = new Date(fimISO).getTime() - agora;
  return { restanteMs, encerrada: restanteMs <= 0 };
}
