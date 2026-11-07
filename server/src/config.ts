import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(3100),
  MONGO_URL: z.string().default('mongodb://localhost:27017/klavio'),
  /**
   * Origin the browser sees, e.g. https://localhost:8443 — used for WebAuthn + CSRF origin check.
   * Normalised like the browser's Origin header ("https://klavio.ch:443" → "https://klavio.ch").
   */
  APP_ORIGIN: z
    .url()
    .default('http://localhost:5173')
    .transform((u) => new URL(u).origin),
  /** WebAuthn relying-party ID: the registrable domain (no scheme, no port). */
  RP_ID: z.string().default('localhost'),
  /** Server-side secret (>= 32 chars) used to HMAC e-mail codes. */
  AUTH_SECRET: z.string().min(32),
  COOKIE_SECURE: bool.default(true),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  /** Initial value of the global "registration open" switch; admins can change it at runtime. */
  REGISTRATION_OPEN_DEFAULT: bool.default(true),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: bool.default(false),
  SMTP_REQUIRE_TLS: bool.default(true),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Klavio <no-reply@localhost>'),
  TRUST_PROXY: bool.default(false),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
