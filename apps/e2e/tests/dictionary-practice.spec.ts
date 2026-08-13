import { test, expect } from '@playwright/test';

import { WEB_URL, registerStudentAndSelectLanguage, completeLearnWordsSession } from './helpers';

/**
 * Dictionary practice session, the second half of phase 9's "paywall/checkout flow and a
 * dictionary practice/review session" task.
 *
 * The paywall/checkout half is N/A: `apps/web` has no paywall/subscription UI (confirmed by
 * search in phase 4), and `apps/api/.env`'s `STRIPE_SECRET_KEY` is empty — there's no
 * Payments module in code at all (see the `apps/api/CLAUDE.md` doc/code drift note added in
 * phase 8). Nothing to drive an E2E test through.
 *
 * The "Practice" button on MyDictionaryPage doesn't lead to /dictionary/practice/:id as its
 * route name suggests — it navigates to the "Learn Words" flow
 * (/exercises/vocabulary/learn -> .../preview -> .../session), a 4-step guided session
 * (letter-pick -> word-to-translate -> translate-to-word -> matching) that happens to be
 * built on the same dictionary-practice API underneath. This test follows that real path.
 *
 * A dictionary *review* (FSRS) session isn't reachable from a fresh account in one test —
 * a word only enters the review pool once every drill type reaches 100% learned (see
 * `packages/shared/CLAUDE.md`'s "Dictionary Revision" section), which takes multiple
 * practice passes. Covering practice only here; review is a reasonable follow-up once a
 * seed/fixture path for "already-learned" words exists.
 */
test('student adds a word and completes a Learn Words practice session', async ({ page }) => {
  await registerStudentAndSelectLanguage(page);

  await page.goto(`${WEB_URL}/dictionary/my`);

  await page.getByRole('button', { name: 'Add Word' }).click();
  await page.getByLabel('Croatian word').fill('jabuka');
  await page.getByLabel('Translation').fill('apple');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('jabuka')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Practice' }).click();
  await expect(page).toHaveURL(`${WEB_URL}/exercises/vocabulary/learn`, { timeout: 15_000 });

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/\/exercises\/vocabulary\/learn\/preview/, { timeout: 15_000 });

  // Preview carousel: with only one word it's immediately the last, so the button reads
  // "Start Exercises" rather than "Next" (see LearnWordsPreviewPage.tsx's `isLast` check).
  await page.getByRole('button', { name: 'Start Exercises' }).click();
  await expect(page).toHaveURL(/\/exercises\/vocabulary\/learn\/session/, { timeout: 15_000 });

  await completeLearnWordsSession(page, 'jabuka', 'apple');
});
