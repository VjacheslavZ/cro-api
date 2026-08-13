import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

/**
 * Deletes E2E-generated data left behind by the golden-path specs so repeated local/CI runs
 * don't accumulate garbage in the shared dev database:
 *   - ExerciseTopic rows created by admin-golden-path.spec.ts (name prefix "E2E Topic ", see
 *     that spec's `topicName`) — cascades to ExerciseTopicType/TypeTheAnswerItem/
 *     FlashcardItem/FillInBlankItem/BuildSentenceItem via the schema's onDelete: Cascade.
 *   - User rows created by registerStudentAndSelectLanguage() (email prefix "e2e-" / domain
 *     "@e2e.local", see helpers.ts's uniqueEmail) — cascades to every user-owned table
 *     (dictionary words, sessions, streak log, etc.) the same way.
 * Wired up as Playwright's globalTeardown (see playwright.config.ts), so it runs once after
 * every `playwright test` invocation regardless of pass/fail. Also runnable standalone via
 * `npm run -w cro-e2e cleanup` to sweep up data from before this teardown existed.
 */
export async function cleanupE2eData(): Promise<void> {
  loadApiEnv();
  const prisma = new PrismaClient();
  try {
    const { count: topicsDeleted } = await prisma.exerciseTopic.deleteMany({
      where: { nameHr: { startsWith: 'E2E Topic ' } },
    });
    const { count: usersDeleted } = await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e-', endsWith: '@e2e.local' } },
    });
    // eslint-disable-next-line no-console
    console.log(`[e2e cleanup] removed ${topicsDeleted} topic(s), ${usersDeleted} user(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Playwright's globalTeardown process doesn't load apps/api/.env — read DATABASE_URL
 * straight from it so PrismaClient can connect without duplicating config.
 */
function loadApiEnv(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(__dirname, '../../api/.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^"|"$/g, '');
  }
}

export default cleanupE2eData;

if (require.main === module) {
  cleanupE2eData()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
