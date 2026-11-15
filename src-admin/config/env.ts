/**
 * Centralized Frontend Environment & API Configuration
 * All client code must import environment values from this module.
 */
export const frontendConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  isProduction: Boolean(import.meta.env.PROD),
  isDevelopment: Boolean(import.meta.env.DEV),
} as const;

export default frontendConfig;
