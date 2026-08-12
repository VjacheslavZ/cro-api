# Plan: Test Coverage Plan

**PRD:** prd-test-coverage-plan
**Date:** 2026-08-12

## Implementation phases

### Phase 1: Backend coverage tooling + first service tests (tracer bullet)

**Goal:** Prove the full backend testing loop end-to-end — coverage measurement wired up and the highest-risk untested service (admin auth) covered.
**Affects:** backend
**Tasks:**

- [x] Wire a line-coverage report into the `apps/api` test run (e.g. `--experimental-test-coverage` on the existing `node --test` invocation, or `c8`)
- [x] Add `admin-auth.service.spec.ts` using the existing `mock.fn()` / no-`TestingModule` pattern from `progress.service.spec.ts`
- [x] Add spec(s) for the `auth` module service(s)
- [x] Confirm coverage output reports a line % for `src/modules/**`

**Done when:** `npm run -w cro-api test:coverage`-equivalent produces a line-coverage percentage, and `admin-auth`/`auth` services have passing tests.

### Phase 2: Remaining backend service test coverage

**Goal:** Bring all currently-untested backend services up to the same test standard so `apps/api` reaches the 70% line target.
**Affects:** backend
**Tasks:**

- [x] Add `admin.service.spec.ts`
- [x] Add `content.service.spec.ts` and `content-cache.service.spec.ts`
- [x] Add specs for `dictionary.service.ts`, `dictionary-collections.service.ts`, `dictionary-practice.service.ts`, `dictionary-review.service.ts`
- [x] Add `users.service.spec.ts` and `lessons.service.spec.ts`

**Done when:** `apps/api` line coverage for `src/modules/**` is at or above 70%.

### Phase 3: Frontend test infrastructure — web (tracer bullet)

**Goal:** Get Jest + RTL running in `apps/web` for the first time, proven with one passing test.
**Affects:** frontend
**Tasks:**

- [x] Add Jest + React Testing Library config and dependencies to `apps/web`
- [x] Add `test` and `test:coverage` scripts to `apps/web/package.json`
- [x] Add the first exercise-component test as the tracer

**Done when:** `npm run -w cro-web test` runs and passes with at least one test.

### Phase 4: apps/web feature test coverage

**Goal:** Cover the remaining priority frontend areas in `apps/web` per root `CLAUDE.md` order, reaching the 60% target.
**Affects:** frontend
**Tasks:**

- [x] Add tests for remaining exercise components (FlashcardExercise from phase 3, plus TextInputExercise, TypeTheAnswerExercise, FillInBlankExercise, BuildSentenceExercise family, LetterPickExercise, MatchingExercise, SpeedQuizCard, DictionaryReviewExercise — 108 tests across 15 files)
- [x] Add tests for the auth flow (LoginPage, EmailAuthForm, LanguageSelectPage — 8 tests)
- [x] ~~Add tests for the paywall~~ — N/A: no paywall/subscription UI exists in `apps/web` yet (confirmed by search; matches the `apps/api` Payments/Subscriptions module gap already flagged in the PRD)
- [x] Add tests for Redux slices (`auth.slice.ts`, `preferences.slice.ts` — 11 tests; note these live in `src/store/`, not `src/features/**`, so they don't count toward the coverage metric below)

**Done when:** `apps/web` line coverage for `src/features/**` is at or above 60%. **Not met: actual is 25.99%.** All tasks above are complete and 77 tests pass, but this metric spans all of `src/features/**`, which includes `dictionary/` (2319 lines, 0% — not mentioned in this phase's task list), `home/`, `lessons/`, `settings/` (443 lines combined, 0%), and the exercise *page* orchestrators (`SessionPage`, `ExercisesPage`, `VocabularyPage`, `TopicExercisesPage`, `LearnWords*`, `SpeedQuizPage`, `useSpeedQuiz` — deliberately out of scope here as page-level containers better suited to Playwright E2E per phase 9). The task list only ever covered exercise *components* + auth + redux, which was never enough to move a repo-wide `src/features/**` percentage past ~26%. This is a scoping error in the original plan, not a shortfall in execution — flagged for the user to decide: accept as-is, add a follow-up phase for `dictionary/`+`home/`+`lessons/`+`settings/`, or narrow the coverage target to the directories this phase actually covers.

### Phase 5: Frontend test infrastructure — admin (tracer bullet)

**Goal:** Get Jest + RTL running in `apps/admin` for the first time, proven with one passing test.
**Affects:** frontend
**Tasks:**

- [x] Add Jest + React Testing Library config and dependencies to `apps/admin`
- [x] Add `test` and `test:coverage` scripts to `apps/admin/package.json`
- [x] Add the first content-management form test as the tracer

**Done when:** `npm run -w cro-admin test` runs and passes with at least one test.

### Phase 6: apps/admin feature test coverage

**Goal:** Cover the remaining priority frontend areas in `apps/admin`, reaching the 60% target.
**Affects:** frontend
**Tasks:**

- [x] Add tests for remaining content-management forms (CreateTopicForm — 4 Tiptap `RichTextEditor` instances mocked out to avoid known jsdom/ProseMirror flakiness — DistractorSetForm, CreateLessonForm + LessonItemsSection, AddWordForm (debounced AI-translation autofill), and the 3 per-exercise-type `AddExerciseQuestion` forms — 46 tests across 8 files)
- [x] Add tests for the admin auth flow (`auth-context.tsx`, `LoginPage.tsx` — 9 tests)
- [x] Add tests for admins management (`CreateAdminForm`, `AdminsTab`, `AdminsPage` — 12 tests; `CreateAdminTab` skipped, no independent logic beyond a `Paper` wrapper)

**Done when:** `apps/admin` line coverage for `src/features/**` is at or above 60%. **Not met: actual is 34.15%.** Same scoping issue as phase 4: this phase's task list only ever named forms + auth + admins management, but the metric spans all of `src/features/**`. Zero-coverage, out-of-scope contributors dragging it down: every `*Table.tsx`/`*Page.tsx` list-and-navigation component (`CollectionsTable`, `TopicsTable`, `DistractorSetsTable`, `LessonsTable`, `WordsTable`, `ContentTable` ×4, `ExercisePage`, `TopicsPage`, `DictionaryCollectionsPage`, `CollectionWordsPage`, `DistractorSetsPage`, `LessonsPage`), and the entire `exercise/BuildSentence/` subtree (1238 lines — an LLM-integration-heavy item editor with 4 custom hooks for distractor regeneration and AI translation, deliberately left out here as a poor fit for RTL unit tests, more suited to Playwright E2E per phase 9). All named tasks are complete and 70 tests pass (all green with the rest of the admin suite); flagged for the user to decide the same way as phase 4: accept as-is, add a follow-up phase for the table/page components, or narrow the coverage target.

### Phase 7: packages/shared domain logic tests

**Goal:** Cover the shared FSRS and XP/streak domain logic, which currently has zero tests.
**Affects:** backend
**Tasks:**

- [x] ~~Add tests for FSRS scheduling rules~~ — N/A: no FSRS logic exists in `packages/shared`. `packages/shared/src` contains only `types/index.ts` (type declarations, no functions), `constants/index.ts` (plain constants, no functions), and `utils/index.ts` (one function, see below). The actual FSRS scheduler lives entirely in `apps/api/src/modules/dictionary/dictionary-review.service.ts` (real `ts-fsrs` usage) and was already covered by 19 tests in phase 2 (`dictionary-review.service.spec.ts`).
- [x] ~~Add tests for XP/streak calculation rules~~ — N/A, same reason: this logic lives in `apps/api/src/modules/gamification/gamification.service.ts`, already covered by 7 tests in phase 1 (`gamification.service.spec.ts`). Nothing under `packages/shared` computes XP or streaks.
- [x] Add tests for the one actual untested function in `packages/shared`: `normalizeAnswer` (`src/utils/index.ts`) — trim/lowercase/NFC-normalize used for answer comparison. 6 tests (whitespace trimming, case-folding, NFC normalization of precomposed vs. decomposed diacritics, combined behavior, empty input, already-normalized input). Wired up `test`/`test:coverage` scripts for the package for the first time (`node:test` + `ts-node`, matching the `apps/api` convention — this package has no React/DOM dependency, so Jest would've been unnecessary weight).

**Done when:** `packages/shared` has passing tests covering FSRS scheduling and XP/streak logic. **N/A as stated** — this metric describes logic that isn't located in this package (see above); the actual FSRS/XP/streak logic is already tested where it lives, in `apps/api`. Revised done-when actually met: `npm run -w @cro/shared test:coverage` reports 100% line coverage for `src/utils/index.ts`, the only executable code in the package.

**Side finding**: `apps/web/src/shared/lib/content-utils.ts` defines its own separate, identical `normalizeAnswer` rather than importing `@cro/shared`'s — `@cro/shared`'s version currently has zero consumers anywhere in the monorepo (dead code, not fixed here — out of scope for this phase, flagged for awareness).

### Phase 8: CI coverage reporting + documentation flag

**Goal:** Surface coverage for all four packages in CI without blocking merges, and record the `apps/api/CLAUDE.md` module-list discrepancy.
**Affects:** backend, frontend
**Tasks:**

- [ ] Add a non-blocking coverage-reporting step to `.github/workflows/ci.yml` covering `apps/api`, `apps/web`, `apps/admin`, `packages/shared`
- [ ] Verify the step reports coverage without failing the CI run when thresholds aren't met
- [ ] Note the `apps/api/CLAUDE.md` module-list discrepancy (Payments/Subscriptions/RevenueCat/Notifications/Analytics modules don't exist in code) in the PR description or a follow-up ticket

**Done when:** a CI run on this branch shows coverage output for all four packages, and the documentation discrepancy is recorded.

### Phase 9: Playwright E2E coverage for golden-path flows

**Goal:** Add browser-level end-to-end coverage for the critical user journeys already listed in root `CLAUDE.md`'s "Verification" section, layered on top of (not replacing) the Jest+RTL unit/component coverage from phases 3-6.
**Affects:** frontend, backend
**Tasks:**

- [ ] Add Playwright to the monorepo (dependency + config), running against local dev servers for `apps/web` and `apps/admin` plus `apps/api` and Docker Compose Postgres/Redis
- [ ] Add an E2E test for the student golden path: login → language selection → browse topics → complete an exercise session → XP awarded
- [ ] Add an E2E test for the admin golden path: admin login → create a topic + items (all exercise types) → item appears in the student app
- [ ] Add an E2E test for the paywall/checkout flow (Stripe test mode) and a dictionary practice/review session

**Done when:** `npx playwright test` runs the golden-path suite against a local dev stack and all tests pass.
