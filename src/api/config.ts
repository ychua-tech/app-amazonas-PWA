/**
 * URL base da API do supermercado.
 * Defina em `.env` como EXPO_PUBLIC_API_URL=https://api.suaempresa.com
 * Sem isso, o app roda 100% com os dados de exemplo (modo offline/demo).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? null;

export const API_ATIVA = API_URL != null;

/** Timeout padrão das requisições, em ms */
export const API_TIMEOUT = 8000;
