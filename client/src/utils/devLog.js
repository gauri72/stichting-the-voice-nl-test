/** Console logging that's silent in production builds (gated on Vite's import.meta.env.DEV). */
export function devWarn(...args) {
  if (import.meta.env.DEV) console.warn(...args);
}

export function devInfo(...args) {
  if (import.meta.env.DEV) console.info(...args);
}
