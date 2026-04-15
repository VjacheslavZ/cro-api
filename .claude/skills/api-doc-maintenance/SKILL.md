---
name: exercise-doc-maintenance
description: Reminds Claude to offer updating docs/exercises.md after modifying exercise or dictionary files — both API modules (NestJS) and web exercise components (React). Auto-loads when editing those files.
paths:
  - "apps/api/src/modules/dictionary/**/*.ts"
  - "apps/api/src/modules/exercises/**/*.ts"
  - "apps/web/src/features/exercises/**/*.ts"
  - "apps/web/src/features/exercises/**/*.tsx"
---

# Exercise & Doc Maintenance Rule

After completing any change to a file matched by this skill's paths, check whether `docs/exercises.md` needs updating.

**Offer to update `docs/exercises.md` if any of these changed:**

| Change | What to update in docs |
|--------|----------------------|
| New or renamed API endpoint | Endpoint table in the relevant section |
| Request/response shape changed | DTO field list or response example |
| Practice session flow changed | Session lifecycle description |
| Progress calculation changed | Progress % formula or field names |
| New query param added | Query param table |
| Pagination behavior changed | Cursor pagination description |
| Dictionary practice logic changed | Practice session section |
| Exercise component callback contract changed | Component callback contracts section |
| `fetchMe` / `AuthGuard` interaction changed | Critical gotchas section |
| Learn Words step order or flow changed | Learn Words flow section |
| Inter-step phase behavior changed | Learn Words flow section |

**How to offer:** At the end of your response, add a brief line such as:
> "The `[endpoint/behavior]` changed — want me to update `docs/exercises.md`?"

Use `/update-exercise-docs` as the trigger command if the user confirms.

**Don't offer** for purely internal refactors (rename a variable, extract a helper) that don't change observable API or behavior.
