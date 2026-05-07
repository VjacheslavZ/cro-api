/**
 * One-time data migration: move existing user credentials into better-auth Account table.
 *
 * Run after deploying the better-auth migration:
 *   npx ts-node -r tsconfig-paths/register src/prisma/seed-better-auth-accounts.ts
 */
import { randomUUID } from 'crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true, googleId: true },
  });

  let created = 0;

  for (const user of users) {
    // Email/password users
    if (user.passwordHash) {
      const existing = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
      });
      if (!existing) {
        await prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: user.email,
            providerId: 'credential',
            userId: user.id,
            password: user.passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        created++;
      }
    }

    // Google OAuth users
    if (user.googleId) {
      const existing = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'google' },
      });
      if (!existing) {
        await prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: user.googleId,
            providerId: 'google',
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        created++;
      }
    }
  }

  console.log(`Migration complete — created ${created} account records for ${users.length} users`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
