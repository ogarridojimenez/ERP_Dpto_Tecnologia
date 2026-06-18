/**
 * Logger condicional para SITRADE.
 *
 * - `log/warn/debug/info`: solo emiten en desarrollo (process.env.NODE_ENV !== "production").
 * - `error`: emite siempre, pero queda como punto único para enchufar Sentry/Logflare.
 *
 * Uso: `import { logger } from "@/lib/logger";`
 */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  error: (...args: unknown[]) => {
    // Siempre se emite. Si en el futuro se enchufa Sentry/Logflare,
    // este es el unico punto a modificar.
    console.error(...args);
  },
};
