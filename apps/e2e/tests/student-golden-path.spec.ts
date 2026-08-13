import { test, expect } from '@playwright/test';

import { WEB_URL, registerStudentAndSelectLanguage } from './helpers';

/**
 * Student golden path per root CLAUDE.md's "Verification" section (steps 2-5):
 * register -> land on language selection -> choose language -> redirected to home ->
 * browse topics -> start a Flashcards session on the seeded "Food" topic -> answer every
 * item -> XP awarded on the results page.
 *
 * Uses a fresh email/password account per run (via better-auth's sign-up flow through the
 * real LoginPage UI) rather than a fixture user, so this test doesn't depend on — or
 * interfere with — any specific pre-seeded student account.
 *
 * Requires the seed script to have run (`npm run -w cro-api seed`) so the "Food" topic with
 * an enabled Flashcards item exists. See playwright.config.ts for full prerequisites.
 */
test('student registers, selects a language, and completes a Flashcards session for XP', async ({
  page,
}) => {
  await registerStudentAndSelectLanguage(page);

  await page.getByRole('link', { name: 'Start Learning' }).click();
  await expect(page).toHaveURL(`${WEB_URL}/exercises/grammar`);

  await page.getByText('Food', { exact: true }).click();

  // TopicExercisesPage: pick the Flashcards exercise type card and start the session.
  // Every card has its own "Start" button, so scope to the one under the "Flashcards"
  // heading rather than matching "Start" globally (ExerciseTypeCard.tsx: the heading and
  // the button are siblings two levels up — heading -> text Box -> outer card Box).
  const flashcardsHeading = page.getByRole('heading', { name: 'Flashcards', level: 6 });
  const flashcardsCard = flashcardsHeading.locator('xpath=../..');
  await flashcardsCard.getByRole('button', { name: 'Start' }).click();

  await expect(page).toHaveURL(/\/exercises\/session\//, { timeout: 15_000 });

  // Step through however many flashcards the seeded "Food" topic has, without hardcoding
  // a count: flip the card, self-report "I knew it", repeat until the results page loads.
  const resultsUrl = new RegExp(`${WEB_URL}/exercises/results/`);
  for (let i = 0; i < 25 && !resultsUrl.test(page.url()); i += 1) {
    const flipTarget = page.getByText('Tap to see the translation');
    if (await flipTarget.isVisible().catch(() => false)) {
      await flipTarget.click();
    }
    const knewItButton = page.getByRole('button', { name: 'I knew it' });
    if (await knewItButton.isVisible().catch(() => false)) {
      await knewItButton.click();
    }
    await page.waitForTimeout(300);
  }

  await expect(page).toHaveURL(resultsUrl, { timeout: 15_000 });
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
});
