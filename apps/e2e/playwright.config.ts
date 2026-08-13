import { defineConfig } from '@playwright/test';

/**
 * E2E golden-path suite (Phase 9 of docs/prd-test-coverage-plan.md), layered on top of the
 * Jest+RTL unit/component coverage from phases 3-6 — not a replacement for it.
 *
 * Prerequisites for a live run (none of this happens automatically):
 *   1. `npx playwright install --with-deps chromium` (once, from apps/e2e — no browser
 *      binaries are bundled with the @playwright/test package install)
 *   2. `docker compose up -d` (Postgres on 5434, Redis on 6379 — see root docker-compose.yml)
 *   3. `npm run -w cro-api prisma:migrate` (apply pending migrations)
 *   4. `npm run -w cro-api seed` (seeds the default admin — test@gmail.com / zxcv1234 — plus
 *      the "Food"/"Animals"/etc. topics with Flashcards/TypeTheAnswer/FillInBlank items that
 *      the student golden path exercises)
 *   5. `npm run dev` from the repo root (starts apps/api on :3000, apps/web on :5173,
 *      apps/admin on :5174 via Turbo)
 *
 * `webServer` below can start all three for you instead of step 5, but will NOT install
 * browsers, run migrations, or seed the database — steps 1-4 are still required first.
 */
export default defineConfig({
  testDir: './tests',
  // Sweeps up the "E2E Topic ..." topics and "e2e-...@e2e.local" student accounts these
  // specs create, so repeated runs don't accumulate garbage in the shared dev database.
  // Runs once after the whole suite, pass or fail — see tests/cleanup.ts.
  globalTeardown: './tests/cleanup.ts',
  fullyParallel: false,
  // Single worker: these specs share one local dev-stack instance (one apps/api process,
  // one Postgres connection pool). Running them concurrently caused real flakiness under
  // resource contention — a React state update racing a slower render on a loaded event
  // loop — not just a testing artifact; serializing them was more honest than adding more
  // retry logic to paper over load-dependent timing.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run -w cro-api dev',
      url: 'http://localhost:3000/api/docs',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run -w cro-web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run -w cro-admin dev',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
