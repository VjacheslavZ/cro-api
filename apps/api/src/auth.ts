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
    trustedOrigins: [
      process.env.WEB_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
    ],
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
