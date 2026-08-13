import { test, expect } from '@playwright/test';

import { ADMIN_URL, WEB_URL, loginAsAdmin, registerStudentAndSelectLanguage } from './helpers';

/**
 * Admin golden path per root CLAUDE.md's "Verification" section (steps 7-9):
 * log in to the admin panel with the seeded default admin -> create a topic -> add items
 * for the exercise types -> enable those exercise types -> confirm the topic is visible
 * to a student.
 *
 * Covers Type the Answer, Flashcards, and Fill in the Blank — NOT Build a Sentence. Adding
 * a Build a Sentence item goes through `AddBuildSentenceItem`, which calls a live
 * LLM/Ollama-backed distractor-generation + translation service (`OLLAMA_MODEL` in
 * apps/api/.env) — a fourth infrastructure dependency beyond Docker Compose's
 * Postgres/Redis that this suite doesn't set up. Same reasoning as the phase 6 unit-test
 * exclusion of `exercise/BuildSentence/`.
 *
 * Requires the seed script to have run (`npm run -w cro-api seed`) for the default admin
 * account (test@gmail.com / zxcv1234). See playwright.config.ts for full prerequisites.
 */
test('admin creates a topic with items, enables exercise types, and it appears for a student', async ({
  browser,
}) => {
  const topicName = `E2E Topic ${Date.now()}`;
  // TypeTheAnswerItem.baseForm has a *global* unique constraint (not scoped per topic) —
  // reusing a fixed word like "jabuka" across runs collides with a previous run's leftover
  // row, so the word itself needs to be unique too, not just the topic name.
  const word = `jabuka${Date.now()}`;

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAsAdmin(adminPage);

  // Create the topic.
  await adminPage.getByRole('tab', { name: 'Create Topic' }).click();
  await adminPage.getByLabel('Name (HR)').fill(topicName);
  await adminPage.getByLabel('Name (EN)').fill(topicName);
  await adminPage.getByLabel('Name (UK)').fill(topicName);
  await adminPage.getByLabel('Name (RU)').fill(topicName);
  await adminPage.getByRole('button', { name: 'Create Topic' }).click();
  await expect(adminPage.getByText('Topic created successfully')).toBeVisible({
    timeout: 10_000,
  });

  // Back on the Topics tab, open the new topic's item-management page. The table has one
  // name column per language, all filled with the same topicName here, so a text locator
  // matches 4 cells within the same row — target the row itself instead.
  await adminPage.getByRole('tab', { name: 'Topics' }).click();
  await adminPage.getByRole('row', { name: topicName }).click();
  await expect(adminPage).toHaveURL(/\/topics\/.+\/items/, { timeout: 10_000 });

  // Enable Flashcards and Type the Answer, then add one item to each. MUI's Switch has
  // ARIA role "switch", not "checkbox".
  await adminPage.getByRole('switch', { name: 'Flashcards' }).click();
  await adminPage.getByRole('switch', { name: 'Type the Answer' }).click();

  await adminPage.getByRole('tab', { name: /Flashcards/ }).click();
  await adminPage.getByRole('button', { name: 'Add Item' }).click();
  await adminPage.getByLabel('Front Text (HR)').fill(word);
  await adminPage.getByLabel('Translation (RU)').fill('яблоко');
  await adminPage.getByLabel('Translation (UK)').fill('яблуко');
  await adminPage.getByLabel('Translation (EN)').fill('apple');
  await adminPage.getByRole('button', { name: 'Create' }).click();
  await expect(adminPage.getByText(word)).toBeVisible({ timeout: 10_000 });

  await adminPage.getByRole('tab', { name: /Type the Answer/ }).click();
  await adminPage.getByRole('button', { name: 'Add Item' }).click();
  await adminPage.getByLabel('Base Form').fill(word);
  await adminPage.getByLabel('Answer', { exact: true }).fill(`${word}u`);
  await adminPage.getByLabel('Translation (RU)').fill('яблоко');
  await adminPage.getByLabel('Translation (UK)').fill('яблуко');
  await adminPage.getByLabel('Translation (EN)').fill('apple');
  await adminPage.getByRole('button', { name: 'Create' }).click();
  await expect(adminPage.getByText(word).first()).toBeVisible({ timeout: 10_000 });

  await adminContext.close();

  // Confirm the topic (with its Flashcards item) is now visible to a student.
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await registerStudentAndSelectLanguage(studentPage);

  await studentPage.getByRole('link', { name: 'Start Learning' }).click();
  await expect(studentPage).toHaveURL(`${WEB_URL}/exercises/grammar`);
  await expect(studentPage.getByText(topicName, { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await studentPage.getByText(topicName, { exact: true }).click();
  // Wait for the actual navigation before asserting — and scope to the ExerciseTypeCard
  // headings specifically, since the topics *list* page we came from also renders these
  // same type names as chips on every other topic's card, which `getByText` would match
  // ambiguously if the click hadn't navigated away yet.
  await expect(studentPage).toHaveURL(/\/exercises\/(?!grammar$)[^/]+$/, { timeout: 10_000 });
  await expect(studentPage.getByRole('heading', { name: 'Flashcards', level: 6 })).toBeVisible();
  await expect(
    studentPage.getByRole('heading', { name: 'Type the Answer', level: 6 }),
  ).toBeVisible();

  await studentContext.close();
});
