import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const WEB_URL = 'http://localhost:5173';
export const ADMIN_URL = 'http://localhost:5174';

/** Default admin account created by `npm run -w cro-api seed` (see apps/admin/CLAUDE.md). */
export const SEEDED_ADMIN = { email: 'test@gmail.com', password: 'zxcv1234' };

export function uniqueEmail(prefix: string) {
  return `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.local`;
}

/**
 * Registers a brand-new student account through the real LoginPage UI (better-auth
 * email/password sign-up) and selects English as the native language, landing on "/".
 * Returns the email used, in case a test wants to identify this user later.
 */
export async function registerStudentAndSelectLanguage(page: Page): Promise<string> {
  const email = uniqueEmail('student');

  await page.goto(`${WEB_URL}/login`);
  await page.getByText("Don't have an account? Register").click();
  await page.getByText('Continue with email').click();

  await page.getByLabel(/Name/).fill('E2E Student');
  await page.getByLabel(/Email/).fill(email);
  await page.getByLabel(/Password/).fill('e2e-test-password-1234');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(`${WEB_URL}/language-select`, { timeout: 15_000 });
  await page.getByText('English', { exact: true }).first().click();
  await expect(page).toHaveURL(`${WEB_URL}/`, { timeout: 15_000 });

  return email;
}

/** Logs in as the seeded default admin account, landing on /topics. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByLabel('Email').fill(SEEDED_ADMIN.email);
  await page.getByLabel('Password').fill(SEEDED_ADMIN.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(`${ADMIN_URL}/topics`, { timeout: 15_000 });
}

/**
 * Drives the "Learn Words" 4-step session (letter-pick -> word-to-translate ->
 * translate-to-word -> matching, see LearnWordsSessionPage.tsx) to completion for a
 * single word, answering correctly every time. Detects which of the three exercise
 * components is currently rendered and interacts with it accordingly:
 *   - LetterPickExercise: click each pool-letter button in the word's order (clicking,
 *     not `keyboard.type`, matters here — the component's global keydown listener reads
 *     `pool`/`placed` React state in a closure, and typing faster than a re-render can
 *     race and mis-register a letter as an "error"; discrete Playwright clicks each wait
 *     for the DOM to settle first).
 *   - TextInputExercise (used for both translate directions): has a text input with a
 *     direction-specific placeholder -> fill the matching answer and click Check.
 *   - MatchingExercise: click the single masked word row, then the translation text.
 * Assumes exactly one word in the session (correct-answer routing only needs one pair).
 */
export async function completeLearnWordsSession(
  page: Page,
  wordHr: string,
  translation: string,
): Promise<void> {
  const resultsHeading = page.getByText('Learning Session Complete!');

  // Bounded by iteration count, not a literal "one per exercise" budget: the
  // LetterPickExercise branch below can burn an extra iteration when its "Next" button
  // check races the render that shows it (checked immediately after the last letter
  // click, before React commits `hasError`) — the exercise doesn't advance that pass, and
  // the same word gets re-placed on the next one. A tight `step < 4` cap (one per exercise)
  // was observed eating the entire budget on exercise 1 alone under load, leaving the loop
  // to exit before ever reaching the matching exercise (4th) — not a hang, just no attempt
  // made. Give real slack above the 4 exercises rather than re-tuning a fixed count;
  // `resultsHeading` becoming visible still ends the loop as soon as the session finishes.
  for (let step = 0; step < 10 && !(await resultsHeading.isVisible().catch(() => false)); step += 1) {
    const wordToTranslatePlaceholder = page.getByPlaceholder('Enter translation...');
    const translateToWordPlaceholder = page.getByPlaceholder('Enter Croatian word...');
    const maskedWordRow = page.getByText('*************').first();

    if (await wordToTranslatePlaceholder.isVisible().catch(() => false)) {
      // TextInputExercise's onChange auto-submits the moment the (normalized) value
      // matches the correct answer — no separate Check click needed, and the button is
      // actually disabled by then since `checked` flips true synchronously in onChange.
      await wordToTranslatePlaceholder.fill(translation);
    } else if (await translateToWordPlaceholder.isVisible().catch(() => false)) {
      await translateToWordPlaceholder.fill(wordHr);
    } else if (await maskedWordRow.isVisible().catch(() => false)) {
      // React needs to commit `selectedWordId` from the first click before the
      // translation click's handler will see it, and Playwright's per-action
      // actionability wait doesn't cover that app-state gap. Rather than gambling on a
      // fixed delay, wait for the concrete DOM signal that the commit happened: the
      // masked word's card gets a 2px border the instant `isSelected` flips true (see
      // MatchingExercise.tsx's `borderWidth: isSelected ? 2 : 1`). The retry loop stays
      // as a safety net for the rare case that check itself times out under load. Since
      // this is always the last of the 4 steps, a successful match can navigate straight
      // to the results page in the same tick — check for that too, or a retry would
      // click into thin air.
      const wordCard = maskedWordRow.locator('xpath=..');
      const matchedCount = page.getByText('1 / 1 matched');
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (await resultsHeading.isVisible().catch(() => false)) break;
        await maskedWordRow.click();
        await expect(wordCard).toHaveCSS('border-width', '2px', { timeout: 2_000 }).catch(() => {});
        if (await resultsHeading.isVisible().catch(() => false)) break;
        await page.getByText(translation, { exact: true }).click();
        await page.waitForTimeout(300);
        if (
          (await matchedCount.isVisible().catch(() => false)) ||
          (await resultsHeading.isVisible().catch(() => false))
        ) {
          break;
        }
      }
    } else {
      // LetterPickExercise: click each needed letter's button in order. Used letters
      // become invisible spacers (removed from the a11y tree), so `.first()` always
      // resolves to the next unused instance of that character.
      for (const char of wordHr.toLowerCase()) {
        await page
          .getByRole('button', { name: new RegExp(`^${char}$`, 'i') })
          .first()
          .click();
      }
      // hasError (e.g. from a stray double-click) suppresses auto-advance and shows a
      // manual "Next" button instead — click it if present as a defensive fallback.
      const nextButton = page.getByRole('button', { name: 'Next' });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
      }
    }

    await page.waitForTimeout(1_500); // CORRECT_DELAY / step auto-advance
  }

  await expect(resultsHeading).toBeVisible({ timeout: 15_000 });
}
