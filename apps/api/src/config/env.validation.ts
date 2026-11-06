import { z } from 'zod';

export const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    JWT_ACCESS_EXPIRY_SECONDS: z.coerce.number().default(900),
    JWT_REFRESH_EXPIRY_SECONDS: z.coerce.number().default(2592000),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    API_URL: z.string().url().default('http://localhost:3000'),
    WEB_URL: z.string().url().default('http://localhost:5173'),
    ADMIN_URL: z.string().url().default('http://localhost:5174'),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    OLLAMA_URL: z.string().url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('translategemma:12b'),
  })
  .superRefine((env, ctx) => {
    // better-auth reads this variable itself and refuses to start in production without it.
    if (env.NODE_ENV === 'production' && !env.BETTER_AUTH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'Required in production: it signs user sessions',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;
