import { PrismaService } from './prisma.service';
import { GamificationService } from '../modules/gamification/gamification.service';
import { DictionaryReviewService } from '../modules/dictionary/dictionary-review.service';

/**
 * One-time backfill: seeds an FSRS review card for every dictionary word that was
 * already fully learned before the Revision feature existed. Safe to re-run —
 * `seedAllLearnedWords` skips words that already have a card.
 */
async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const gamification = new GamificationService(prisma);
  const review = new DictionaryReviewService(prisma, gamification);

  const seededCount = await review.seedAllLearnedWords();
  console.log(`Seeded ${seededCount} FSRS review card(s) for already-learned words.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
