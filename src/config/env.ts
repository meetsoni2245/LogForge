/**
 * env.ts
 *
 * Single source of truth for all environment variables.
 *
 * Why put this in its own file?
 * - Every module imports from here instead of reading process.env directly.
 * - If a required variable is missing the server fails fast at startup with
 *   a clear error, rather than failing silently at runtime.
 * - PORT is typed as a number here, not the raw string that process.env gives.
 *
 * Environment variables are added here as their respective features are implemented.
 */

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function requiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: parseInt(optionalEnv("PORT", "3000"), 10),
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: optionalEnv("JWT_EXPIRES_IN", "1h"),
} as const;
