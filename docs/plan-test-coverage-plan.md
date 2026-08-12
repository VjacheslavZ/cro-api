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

- [ ] Add `admin.service.spec.ts`
- [ ] Add `content.service.spec.ts` and `content-cache.service.spec.ts`
- [ ] Add specs for `dictionary.service.ts`, `dictionary-collections.service.ts`, `dictionary-practice.service.ts`, `dictionary-review.service.ts`
- [ ] Add `users.service.spec.ts` and `lessons.service.spec.ts`

**Done when:** `apps/api` line coverage for `src/modules/**` is at or above 70%.

### Phase 3: Frontend test infrastructure — web (tracer bullet)

**Goal:** Get Jest + RTL running in `apps/web` for the first time, proven with one passing test.
**Affects:** frontend
**Tasks:**

- [ ] Add Jest + React Testing Library config and dependencies to `apps/web`
- [ ] Add `test` and `test:coverage` scripts to `apps/web/package.json`
- [ ] Add the first exercise-component test as the tracer

**Done when:** `npm run -w cro-web test` runs and passes with at least one test.

### Phase 4: apps/web feature test coverage

**Goal:** Cover the remaining priority frontend areas in `apps/web` per root `CLAUDE.md` order, reaching the 60% target.
**Affects:** frontend
**Tasks:**

- [ ] Add tests for remaining exercise components
- [ ] Add tests for the auth flow
- [ ] Add tests for the paywall (trial / plan display)
- [ ] Add tests for Redux slices

**Done when:** `apps/web` line coverage for `src/features/**` is at or above 60%.

### Phase 5: Frontend test infrastructure — admin (tracer bullet)

**Goal:** Get Jest + RTL running in `apps/admin` for the first time, proven with one passing test.
**Affects:** frontend
**Tasks:**

- [ ] Add Jest + React Testing Library config and dependencies to `apps/admin`
- [ ] Add `test` and `test:coverage` scripts to `apps/admin/package.json`
- [ ] Add the first content-management form test as the tracer

**Done when:** `npm run -w cro-admin test` runs and passes with at least one test.

### Phase 6: apps/admin feature test coverage

**Goal:** Cover the remaining priority frontend areas in `apps/admin`, reaching the 60% target.
**Affects:** frontend
**Tasks:**

- [ ] Add tests for remaining content-management forms
- [ ] Add tests for the admin auth flow
- [ ] Add tests for admins management

**Done when:** `apps/admin` line coverage for `src/features/**` is at or above 60%.

### Phase 7: packages/shared domain logic tests

**Goal:** Cover the shared FSRS and XP/streak domain logic, which currently has zero tests.
**Affects:** backend
**Tasks:**

- [ ] Add tests for FSRS scheduling rules
- [ ] Add tests for XP/streak calculation rules

**Done when:** `packages/shared` has passing tests covering FSRS scheduling and XP/streak logic.

### Phase 8: CI coverage reporting + documentation flag

**Goal:** Surface coverage for all four packages in CI without blocking merges, and record the `apps/api/CLAUDE.md` module-list discrepancy.
**Affects:** backend, frontend
**Tasks:**

- [ ] Add a non-blocking coverage-reporting step to `.github/workflows/ci.yml` covering `apps/api`, `apps/web`, `apps/admin`, `packages/shared`
- [ ] Verify the step reports coverage without failing the CI run when thresholds aren't met
- [ ] Note the `apps/api/CLAUDE.md` module-list discrepancy (Payments/Subscriptions/RevenueCat/Notifications/Analytics modules don't exist in code) in the PR description or a follow-up ticket

**Done when:** a CI run on this branch shows coverage output for all four packages, and the documentation discrepancy is recorded.
