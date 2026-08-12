# PRD: API Security Hardening & Test Coverage Gaps

**Date**: 2026-08-12
**Status**: Draft

## Goal

Two parallel audits of `apps/api` (security review + test coverage review) surfaced exploitable vulnerabilities and untested core business logic. This PRD tracks the fixes required to close the IDOR/XP-inflation holes, restore rate limiting, patch a vulnerable dependency, and bring test coverage on priority services (per `apps/api/CLAUDE.md`) up to the point where regressions in this area would be caught automatically.

## User scenarios

- A student finishes a dictionary practice session with a `wordId` that belongs to another user's word -> the request is rejected (403/404), no cross-user data is written or read.
- A student submits a `finishSession`/`finishPractice` payload with duplicate or fabricated answer entries exceeding the session's real item count -> only the legitimate, deduplicated answers (capped at `session.totalQuestions`) count toward XP/streak.
- An attacker attempts repeated login requests against `POST /admin/auth/login` or better-auth's email/password endpoint -> requests beyond the configured limit are throttled (429).
- A developer runs `npm audit` against the `cro-api` workspace -> no critical/high advisories remain for `better-auth` or `multer`/`@nestjs/platform-express`.
- A developer runs the backend test suite -> `ProgressService.recordAttempts`, `ExercisesService.getSession`/`resetCycle`, and `AdminAuthService` all have passing, meaningful specs; the currently-failing `createSession` "happy path" test passes.

## In scope

**Critical security fixes**
1. Fix IDOR in `DictionaryPracticeService.finishSession` (`apps/api/src/modules/dictionary/dictionary-practice.service.ts:213-236,239-255,260-280`): before any `dictionaryWordProgress`/`dictionaryWordReview` upsert keyed by `wordId`, verify the word belongs to the requesting `userId` (via `userDictionaryWord.findUnique`); reject or skip entries that don't.
2. Prevent XP inflation via fabricated/duplicated answers in `ExercisesService.finishSession` (`apps/api/src/modules/exercises/exercises.service.ts:78-121`) and `DictionaryPracticeService.finishSession` (`apps/api/src/modules/dictionary/dictionary-practice.service.ts:184-287`): dedupe answers by `itemId`/`wordId` and cap counted answers at the session's real item/question count, mirroring the fix already applied to `DictionaryReviewService.finishSession` in commit `9fb7d39`. Add `@ArrayMaxSize` to `FinishSessionDto` and `FinishPracticeDto`.

**Important security fixes**
3. Bind `ThrottlerGuard` so rate limiting actually runs: register it as a global `APP_GUARD` (or apply `@UseGuards(ThrottlerGuard)` on `admin-auth`, `users`, and session/practice-finish controllers). Ensure `/api/auth/*` (mounted on raw Express in `apps/api/src/main.ts:51`) is also covered by an equivalent rate limit, since Nest's throttler cannot reach it as currently mounted.
4. Upgrade `better-auth` to `>=1.6.11` to resolve GHSA-cq3f-vc6p-68fh and GHSA-9h47-pqcx-hjr4. Run `npm audit fix` for the `cro-api` workspace to resolve the `multer`/`@nestjs/platform-express` high-severity DoS advisory, and review remaining `js-yaml`/`qs`/`ip-address`/`bullmq`/`geoip-lite` advisories.
5. Add an authorization gate to `POST /admin/admins` (`apps/api/src/modules/admin/admin.controller.ts:15-19`, `admin.service.ts:12-32`) so only a designated super-admin/role tier can create new admin accounts, rather than any authenticated admin.

**Test coverage**
6. Fix the broken `createSession` happy-path test in `apps/api/src/modules/exercises/exercises.service.spec.ts` by stubbing `exerciseTopic.findUnique` in the mock Prisma client.
7. Add test coverage for `ProgressService.recordAttempts` (`apps/api/src/modules/progress/progress.service.ts:97-120`), covering both branches of the `answer.isCorrect` ternary.
8. Add test coverage for `ExercisesService.getSession` (`apps/api/src/modules/exercises/exercises.service.ts:66-76`, including not-found and cross-user `ForbiddenException` cases) and `ExercisesService.resetCycle` (`:145-148`).
9. Create `admin-auth.service.spec.ts` covering `login()` (bcrypt success/failure), `refreshTokens()` (JWT verify failure, wrong `type`, revoked-token branches), `logout()` (catch-swallow path), and `generateTokens()` (Redis TTL write).

## Out of scope

- Full spec coverage for `content.service.ts`, `dictionary-review.service.ts`, `dictionary.service.ts`, `dictionary-practice.service.ts` (beyond item 2 above), `dictionary-collections.service.ts`, `lessons.service.ts`, `users.service.ts`, and `admin/admin.service.ts` — flagged by the coverage audit but not prioritized in this iteration (backend priority list per `CLAUDE.md` covers Progress/Exercises/Gamification/Payments/AdminAuth only).
- Building out `PaymentsService`/webhook idempotency tests — the module doesn't exist yet in `apps/api/src/modules`; needs a team decision on whether/where it's planned before test work can start.
- `start-practice.dto.ts` `wordIds` array size bound (`apps/api/src/modules/dictionary/dto/start-practice.dto.ts:19-23`) — low-risk hygiene item, not addressed in this iteration.
- CORS/`NODE_ENV` production regression test — recommended but not required for this PRD's scope.
- Any new admin role/permission system beyond gating `POST /admin/admins` (e.g. full RBAC).

## Technical constraints

- Fixes must not break the existing dedupe/cap pattern already established in `DictionaryReviewService.finishSession` (commit `9fb7d39`) — reuse that pattern rather than inventing a new one.
- `ThrottlerModule` is already imported in `app.module.ts`; the fix is wiring, not adding a new dependency.
- Backend tests use `node:test` (not Jest) per project convention; new specs must follow existing patterns in `apps/api/src/modules/*/*.spec.ts`.
- `better-auth` upgrade must be verified against `apps/api/src/auth.ts` config (device-authorization/oidcProvider plugins are currently unused, but confirm no behavioral regression on the Google OAuth2 flow after the bump).

## Acceptance criteria

- [ ] Submitting a `FinishPracticeDto` with a `wordId` not owned by the authenticated user is rejected and produces no `dictionaryWordProgress`/`dictionaryWordReview` writes or reads for that word.
- [ ] Submitting `finishSession`/`finishPractice` payloads with more answer entries than the session's real item count, or with duplicate `itemId`/`wordId` entries, results in XP/streak credit bounded by the deduplicated, capped answer set — verified by a test reproducing the original exploit scenario.
- [ ] `FinishSessionDto` and `FinishPracticeDto` reject oversized answer arrays via `@ArrayMaxSize` validation.
- [ ] Repeated requests to `POST /admin/auth/login` beyond the configured throttle limit return `429`, verified by an integration/e2e test.
- [ ] `better-auth` is at `>=1.6.11` and `npm audit` reports no critical advisories for the `cro-api` workspace; `multer`/`@nestjs/platform-express` high-severity advisory is resolved.
- [ ] `POST /admin/admins` is only reachable by admins with the designated elevated role; a non-elevated admin request is rejected.
- [ ] `apps/api/src/modules/exercises/exercises.service.spec.ts` `createSession` happy-path test passes (mock includes `exerciseTopic.findUnique`).
- [ ] `progress.service.spec.ts` covers both branches of `recordAttempts`' `isCorrect` ternary with passing assertions.
- [ ] `exercises.service.spec.ts` covers `getSession` (not-found, cross-user forbidden, happy path) and `resetCycle`.
- [ ] `admin-auth.service.spec.ts` exists and covers `login`, `refreshTokens`, `logout`, and `generateTokens` as described above, all passing.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass at the monorepo root after all changes.
