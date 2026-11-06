import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  corsOrigins: string[];
  isProd: boolean;
}

/**
 * Validates required backend environment variables at startup and fails fast
 * with a clear descriptive error message if any are missing or malformed.
 */
export function validateAndLoadServerConfig(): ServerConfig {
  const missing: string[] = [];

  const portRaw = process.env.PORT || '3000';
  const port = parseInt(portRaw, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`[Configuration Error] Invalid PORT specified: "${portRaw}"`);
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as ServerConfig['nodeEnv'];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    missing.push('JWT_SECRET (must be set with minimum 16 characters)');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Startup Validation Failed] Missing required environment variables:\n  - ${missing.join(
        '\n  - '
      )}\nPlease define them in your .env file.`
    );
  }

  const corsOriginRaw = process.env.CORS_ORIGIN || '';
  const corsOrigins = corsOriginRaw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return {
    port,
    nodeEnv,
    jwtSecret: jwtSecret!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: corsOriginRaw.replace(/\/$/, ''),
    corsOrigins,
    isProd: nodeEnv === 'production',
  };
}

export const serverConfig = validateAndLoadServerConfig();
export default serverConfig;
