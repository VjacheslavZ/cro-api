# cro-web — Student Web App

Vite + React + TypeScript + Material UI (MUI). i18n via i18next (RU/UK/EN).

For exercise type definitions, payment architecture, and domain models, see `packages/shared/CLAUDE.md`.

---

## Architecture

- **State**: Redux Toolkit (auth, UI state) + TanStack Query (server data)
- **Folder structure**: feature-based (`src/features/auth`, `src/features/exercises`, etc.)
- **API client**: axios with interceptors for JWT access/refresh token flow (`src/api/`)
- **Routing**: React Router in `src/app/`

---

## Dictionary UI

### My Dictionary Page (`/dictionary/my`)

- **Top bar**: search `TextField` + "Add Word" `Button` + (when checkboxes selected) "Assign to Collection" dropdown + "Practice" button
- **Word list**: infinite scroll with cursor-based pagination (loads on scroll via `IntersectionObserver`)
- **Each row**:
  ```
  checkbox | word          | collection name (or empty) | progress % | delete icon
             translation
  ```
- **Progress %** = `correctAttempts / totalAttempts * 100` from dictionary practice sessions

### Collections Page (`/dictionary/collections`)

- Two sections: "Predefined Collections" (admin-created) and "My Collections" (user-created)
- Clicking a collection navigates to `/dictionary/my?collectionId=xxx` (filtered view)

### Dictionary Practice

- Reuses existing `TextInputExercise` component
- Show Croatian word (`wordHr`) → user types translation

---

## Exercise Component Conventions

See [docs/exercises.md](../../docs/exercises.md) for component callback contracts, the Learn Words feature, and the critical `fetchMe` / `AuthGuard` unmount gotcha.

**Doc maintenance rule**: When you modify any file under `src/features/exercises/` or any exercise-related API/service, after completing the change offer to update `docs/exercises.md` if the behavior, callback contracts, or gotchas have changed. Use `/update-exercise-docs` as the trigger, or offer inline.
