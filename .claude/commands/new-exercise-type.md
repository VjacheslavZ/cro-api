Add a new exercise type named $ARGUMENTS to the app. Follow these steps in order — each step depends on the previous.

## Context

Three exercise types already exist: `TYPE_THE_ANSWER` (SingularPluralItem), `FLASHCARDS` (FlashcardItem), `FILL_IN_BLANK` (FillInBlankItem). A new type requires changes across Prisma schema, shared types, backend, frontend, admin panel, and docs.

Key files to reference for patterns:
- `src/prisma/schema.prisma` — existing item tables
- `packages/shared/src/types/index.ts` — `ExerciseType` enum + `ExerciseItem` discriminated union
- `apps/api/src/modules/content/content.service.ts` — `getItemsForTopic` / `getItemsByIds` dispatch pattern
- `apps/api/src/modules/exercises/` — session creation / finish DTOs
- `apps/web/src/features/exercises/` — exercise components + session page routing

---

## Step 1 — Prisma Schema

In `apps/api/src/prisma/schema.prisma`:

1. Add a new model for the item (e.g. `$ARGUMENTSItem`) with fields: `id`, `topicId` (FK to `ExerciseTopic`), type-specific fields, `sortOrder`.
2. Run migration:
   ```bash
   npm run -w cro-api prisma:migrate
   # Enter migration name: add_$ARGUMENTS_item
   npm run -w cro-api prisma:generate
   ```

---

## Step 2 — Shared Types (`packages/shared/src/types/index.ts`)

1. Add the new value to `ExerciseType` enum: `$ARGUMENTS = '$ARGUMENTS'`
2. Add the new item interface (e.g. `$ARGUMENTSItem`) with all fields matching the Prisma model.
3. Extend the `ExerciseItem` discriminated union:
   ```ts
   | ({ type: ExerciseType.$ARGUMENTS } & $ARGUMENTSItem)
   ```

---

## Step 3 — Backend: ContentModule

In `apps/api/src/modules/content/content.service.ts`:

1. Inject the new Prisma model (already available via `PrismaService` after step 1).
2. Add the new `exerciseType` case to `getItemsForTopic()`.
3. Add the new `exerciseType` case to `getItemsByIds()`.
4. Add admin CRUD methods: `create$ARGUMENTSItem`, `update$ARGUMENTSItem`, `delete$ARGUMENTSItem`, `get$ARGUMENTSItemsByTopic`.

In `apps/api/src/modules/content/content.controller.ts`:
1. Add admin endpoints:
   - `GET /admin/topics/:topicId/$ARGUMENTS-items`
   - `POST /admin/$ARGUMENTS-items`
   - `PATCH /admin/$ARGUMENTS-items/:id`
   - `DELETE /admin/$ARGUMENTS-items/:id`
2. Add DTOs: `Create$ARGUMENTSItemDto`, `Update$ARGUMENTSItemDto`.

---

## Step 4 — Backend: ExercisesModule

No changes needed if the new type follows the standard session flow (items served via `getItemsByIds`, results processed via `markItemsSeen`). Verify in:
- `apps/api/src/modules/exercises/exercises.service.ts` — if there's a type-specific branch, add the new case.

---

## Step 5 — Frontend Exercise Component (cro-web)

In `apps/web/src/features/exercises/`:

1. Create `$ARGUMENTSExercise.tsx` — component that receives the current item and calls `onAnswer(isCorrect)`. Look at existing components (`TextInputExercise.tsx`, `FlashcardExercise.tsx`) for the prop contract.
2. Register the new component in `SessionPage.tsx` (or wherever exercise type → component dispatch happens).
3. Add a TanStack Query hook in `apps/web/src/api/exercises.ts` if a new endpoint is needed.

---

## Step 6 — Admin Panel Item Tab (cro-admin)

In `apps/admin/src/features/topics/` (or the exercise items page):

1. Add a new tab for `$ARGUMENTS` in the tabbed items view.
2. Create a form component for create/edit (pattern: React Hook Form + Zod schema + `useMutation` + `queryClient.invalidateQueries`). Reference `CreateTopicForm.tsx` for the pattern.
3. Add a table component listing items with edit/delete actions.

---

## Step 7 — Documentation

1. Update `packages/shared/CLAUDE.md` — add a row to the Exercise Types table.
2. Run `/update-exercise-docs` to update `docs/exercises.md` with the new component contract and any new API shapes.
3. Update `apps/api/CLAUDE.md` if new admin endpoints were added (the endpoint table in that file).

---

## Checklist

- [ ] Prisma model added and migration applied
- [ ] `ExerciseType` enum updated in `packages/shared/src/types/index.ts`
- [ ] `ExerciseItem` union extended
- [ ] `ContentService.getItemsForTopic` handles new type
- [ ] `ContentService.getItemsByIds` handles new type
- [ ] Admin CRUD endpoints added
- [ ] Frontend exercise component created
- [ ] Component wired into session page
- [ ] Admin panel tab added
- [ ] `packages/shared/CLAUDE.md` updated
- [ ] `docs/exercises.md` updated (via `/update-exercise-docs`)
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Tests pass: `npm test`
