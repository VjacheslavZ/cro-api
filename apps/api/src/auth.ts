import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { addDays } from 'date-fns';

import type { PrismaService } from './prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: ReturnType<typeof betterAuth<any>> | null = null;

export function initAuth(prisma: PrismaService) {
  const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    baseURL: process.env.API_URL || 'http://localhost:3000',
    trustedOrigins: (request) => {
      const staticOrigins = [
        process.env.WEB_URL || 'http://localhost:5173',
        process.env.ADMIN_URL || 'http://localhost:5174',
      ];
      if (!request) return staticOrigins;
      const origin = request.headers.get('origin') || '';
      const isLocalNetwork =
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/.test(
          origin,
        );
      return isLocalNetwork ? [...staticOrigins, origin] : staticOrigins;
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24,
    },
    user: {
      fields: {
        image: 'avatarUrl',
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await prisma.subscription.create({
              data: {
                userId: user.id,
                status: 'TRIALING',
                trialStartedAt: new Date(),
                trialEndsAt: addDays(new Date(), 7),
              },
            });
          },
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _auth = auth as ReturnType<typeof betterAuth<any>>;
  return _auth;
}

export function getAuth() {
  if (!_auth) throw new Error('better-auth not initialized — call initAuth() first');
  return _auth;
}
