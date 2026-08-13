# PRD: Test Coverage Plan

**Date**: 2026-08-12
**Status**: Draft

## Goal

Establish and reach a baseline of automated test coverage across `apps/api`, `apps/web`, `apps/admin`, and `packages/shared` so that critical business logic (auth, gamification, dictionary, payments-adjacent flows, admin content management) is protected against regressions, and the MVP coverage targets already declared in the root `CLAUDE.md` (backend 70% lines, frontend 60% lines) are actually measured and met.

## User scenarios

- Developer changes `AdminAuthService` login logic -> existing tests fail if the change breaks password verification or token issuance, before the change reaches review.
- Developer refactors `DictionaryService` word-cycle logic -> existing tests catch incorrect due-date/collection behavior.
- Developer adds a component to `apps/web` or `apps/admin` -> CI runs `jest` and reports coverage against the configured threshold, instead of silently having zero frontend test infrastructure.
- Reviewer opens a PR touching `apps/api/src/modules/**` -> CI shows whether backend coverage stayed at or above 70% lines.
- Reviewer opens a PR touching `apps/web/src/features/**` or `apps/admin/src/features/**` -> CI shows whether frontend coverage stayed at or above 60% lines.

## In scope

- **Backend (`node:test`)** — add unit tests, following the existing manual-mock pattern (`mock.fn()` for `PrismaService` and collaborators, service instantiated directly, no `TestingModule`, no test database) already used in `progress.service.spec.ts`, `gamification.service.spec.ts`, `exercises.service.spec.ts`, for the currently untested services:
  - `admin-auth.service.ts`
  - `auth` module services
  - `admin.service.ts`
  - `content.service.ts`, `content-cache.service.ts`
  - `dictionary.service.ts`, `dictionary-collections.service.ts`, `dictionary-practice.service.ts`, `dictionary-review.service.ts`
  - `users.service.ts`
  - `lessons.service.ts`
- **Backend coverage measurement** — wire up a coverage report for `node:test` runs (e.g. `--experimental-test-coverage` or `c8`) and surface the percentage in CI output.
- **Frontend test infrastructure (`apps/web`, `apps/admin`)** — add the missing Jest + React Testing Library configuration and `test`/`test:coverage` scripts to `package.json` in both apps (neither currently has a Jest config or test script).
- **Frontend tests, priority order per root `CLAUDE.md`**:
  - `apps/web`: exercise components -> auth flow -> paywall (trial/plan display) -> Redux slices
  - `apps/admin`: content-management forms -> admin auth flow -> admins management
- **`packages/shared`** — add tests for domain logic currently untested (FSRS scheduling rules, XP/streak calculation rules documented in `packages/shared/CLAUDE.md`).
- **CI coverage reporting** — add a coverage step to the CI pipeline (`.github/workflows/ci.yml`) that runs alongside existing lint/typecheck/test steps and reports line coverage per app.
- **Playwright E2E tests for golden-path user flows** — layered on top of, not replacing, the Jest+RTL unit/component coverage above. Covers the browser-level journeys already listed in root `CLAUDE.md`'s "Verification" section: student login → language selection → browse topics → complete an exercise session → XP awarded; admin login → create topic + items → item appears in student app; paywall/checkout (Stripe test mode); dictionary practice/review sessions.
- **Documentation fix** — flag the mismatch in `apps/api/CLAUDE.md`, which lists `PaymentsModule`, `SubscriptionsModule`, `RevenueCatModule`, `NotificationsModule`, `AnalyticsModule` as existing modules, none of which currently exist under `apps/api/src/modules`. This PRD does not resolve the mismatch, but any coverage work must be scoped to modules that actually exist in code, not to the stale doc.

## Out of scope

- Replacing Jest+RTL with Playwright Component Testing — Playwright is added as an additional E2E layer, not a substitute for the unit/component tests in this PRD.
- Mobile app testing — per root `CLAUDE.md`, mobile remains manual testing via Expo Go for the MVP.
- Load/performance testing.
- Making CI coverage thresholds a hard merge-blocking gate (this PRD covers non-blocking reporting only; blocking enforcement is a possible future iteration).
- Writing tests for controllers (all backend tests today are service-level; this PRD keeps that convention and does not introduce controller-level testing).
- Resolving the `apps/api/CLAUDE.md` module-list documentation discrepancy — only flagging it.

## Technical constraints

- Backend tests must use `node:test` + `node:assert/strict`, run via the existing `--test src/**/*.spec.ts` invocation — no Jest on the backend.
- Backend test mocking must reuse the existing hand-rolled `mock.fn()` pattern for `PrismaService` and dependent services; do not introduce NestJS `TestingModule` or a real/test database.
- Frontend tests must use Jest + React Testing Library per root `CLAUDE.md`, and must be added to `apps/web` and `apps/admin` independently (they are currently unconfigured in both).
- No `jest.config.*` or coverage threshold configuration exists anywhere in the repo today — all of it must be created, not modified.
- Coverage targets must match the values already committed to in root `CLAUDE.md`: 70% lines (backend services), 60% lines (frontend features).
- Playwright is not currently a dependency anywhere in the repo and has no existing config — it must run against the local dev stack (`apps/web`/`apps/admin` dev servers + `apps/api` + Docker Compose Postgres/Redis), the same stack described in root `CLAUDE.md`'s local setup.

## Acceptance criteria

- [ ] Every backend service listed in "In scope" has a corresponding `*.spec.ts` file following the existing `mock.fn()` pattern
- [ ] `apps/api` reports measured line coverage (via CI or a local `npm run -w cro-api test:coverage`-style script) of at least 70% for `src/modules/**` services
- [ ] `apps/web` has a working Jest + RTL configuration and at least one passing test in each of: exercise components, auth flow, paywall, Redux slices
- [ ] `apps/admin` has a working Jest + RTL configuration and at least one passing test in each of: content-management forms, admin auth flow, admins management
- [ ] `apps/web` and `apps/admin` each report measured line coverage of at least 60% for `src/features/**`
- [ ] `packages/shared` has tests covering FSRS scheduling and XP/streak calculation logic
- [ ] CI pipeline (`.github/workflows/ci.yml`) runs and reports coverage for all four packages without blocking merges
- [ ] The `apps/api/CLAUDE.md` module-list discrepancy (non-existent Payments/Subscriptions/RevenueCat/Notifications/Analytics modules) is called out as a known issue in the PR description or a follow-up ticket
- [ ] A Playwright suite exists and passes for the student golden path (login → language selection → browse topics → complete exercise session → XP awarded) and the admin golden path (login → create topic + items → item visible in student app)
