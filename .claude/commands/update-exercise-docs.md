Review recent changes to exercise components and update the documentation if needed.

## Steps

1. Run `git diff HEAD -- 'apps/web/src/features/exercises/**' 'apps/api/src/modules/dictionary/**' 'apps/api/src/modules/exercises/**' 'packages/shared/src/**'` to see what changed in exercise-related code (frontend components, backend services/DTOs, and shared types).

2. Read `docs/exercises.md` to understand the current documented state.

3. Determine what needs updating:
   - **Component callback contracts** — did any `onAnswer` / `onComplete` signature or firing condition change?
   - **Learn Words flow** — did the step order, progress rules (+25/−25), or API shape change?
   - **AuthGuard gotcha** — did anything change about how `fetchMe` interacts with auth loading?
   - **New exercise types** — was a new component added?

4. Edit `docs/exercises.md` with only the sections that actually changed. Do not rewrite sections that are still accurate.

5. If the change is significant (new exercise type, new API endpoint, new gotcha), also update the Feature Documentation table in `ROADMAP.md`.

6. Report what was updated and what was left unchanged.
