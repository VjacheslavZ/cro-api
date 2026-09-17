# cro-web — Student Web App

Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI primitives). i18n via i18next (RU/UK/EN).

**Migration in progress:** the app is moving off Material UI (see `docs/intent/adr-001-web-mui-to-tailwind-shadcn.md`, phases in `docs/plan-web-tailwind-migration.md`). Some feature folders still import `@mui/*`. **Never add new `@mui` imports**; when you touch an MUI screen for a feature, either keep it MUI or migrate the whole page — do not mix both in one page.

For exercise type definitions, payment architecture, and domain models, see `packages/shared/CLAUDE.md`.

---

## UI Stack & Conventions

| What | Where |
|------|-------|
| shadcn primitives (generated, editable source) | `src/components/ui/*` — add more with `npx shadcn@latest add <name>` from `apps/web/` |
| `cn()` class merger | `src/lib/utils.ts` (re-exports the `cn` package) |
| Design tokens (CSS variables + `@theme`) | `src/styles/globals.css` — imported once in `src/main.tsx` |
| Shared building blocks | `src/components/Spinner.tsx`, `PageContainer.tsx` (`size="sm|md|lg"` = old MUI `Container` widths), `ErrorAlert.tsx`, `EmptyState.tsx` |
| Exercise-specific blocks | `src/features/exercises/ui/`: `ExerciseCard`, `ExerciseFeedback`, `ExerciseActionButton` — use these in every exercise component instead of re-styling cards/buttons |
| Icons | `lucide-react`; brand marks lucide lacks (Google, X, YouTube, stores) in `src/assets/icons/` |
| Toasts | `toast()` from `sonner`; `<Toaster />` is mounted in `AppRouter` |
| `@/` alias | → `src/` (vite, tsconfig, jest). Imports from `@/…` are the `internal` ESLint group and go **before** relative imports |

**Tokens** (use classes, not hex): `primary` (brand blue), `foreground`, `muted-foreground`, `border`, `destructive`, plus project colours `success`, `xp` / `xp-foreground` / `xp-muted` / `xp-border`, `streak` / `streak-foreground` / `streak-muted` / `streak-border`.

**Typography recipe** (no `Typography` component): page title `text-3xl font-semibold`, section `text-2xl font-semibold`, card title `text-lg font-medium`, body `text-sm`, hint `text-xs text-muted-foreground`.

**Base UI composition**: primitives have no `asChild`. Use `render={<Link to="…" />}` on `DropdownMenuItem` / triggers; for plain navigation links use `<Link className={cn(buttonVariants({ variant }), extra)}>` so they keep `role="link"` — always wrap in `cn()`: `cva` does not merge conflicting classes, so `outline` would lose its border to the base `border-transparent`.

**Tests**: query by role / label / text. jsdom does not compute Tailwind styles — assert `toHaveClass` or `data-*` attributes, never `toHaveStyle` for class-driven colours. `src/test-utils/jest.setup.ts` shims `Element.prototype.matches` for `:modal` / `:popover-open` (Floating UI probe that is pathologically slow in jsdom).

Full MUI → shadcn mapping table: `docs/plan-web-tailwind-migration.md`.

---

## Architecture

- **State**: Redux Toolkit (auth, UI state) + TanStack Query (server data)
- **Folder structure**: feature-based (`src/features/auth`, `src/features/exercises`, etc.)
- **API client**: axios with interceptors for JWT access/refresh token flow (`src/api/`)
- **Routing**: React Router in `src/app/`

---

## Dictionary UI

### My Dictionary Page (`/dictionary/my`)

- **Top bar**: search input + "Add Word" button + (when checkboxes selected) "Assign to Collection" dropdown + "Practice" button
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

**Doc maintenance**: See `.claude/skills/api-doc-maintenance/SKILL.md` — auto-loads when editing `src/features/exercises/` files and prompts to update `docs/exercises.md` when behavior or contracts change.

---

## Redux Store

**Coding rules**: See `.claude/skills/modern-redux-rules/SKILL.md` — auto-loads when editing `src/store/`. Defines what Redux owns, required RTK patterns, and forbidden anti-patterns.

Two slices in `src/store/`:

| Slice | File | Owns |
|-------|------|------|
| `auth` | `auth.slice.ts` | `user: UserProfile \| null`, `loading: boolean`. Populated by `fetchMe` thunk. Cleared on logout or expired refresh token. |
| `preferences` | `preferences.slice.ts` | `speechEnabled: boolean`. Persisted to `localStorage` (`cro_preferences` key). Not server state — never in TanStack Query. |

---

## API Client & TanStack Query Patterns

**Axios client** (`src/api/client.ts`): base URL from `VITE_API_URL`, attaches `Authorization: Bearer <accessToken>` via request interceptor, handles 401 → refresh token → retry via response interceptor.

**Coding patterns**: See `.claude/skills/web-query-patterns/SKILL.md` — auto-loads when editing `src/api/` files. Covers `useQuery`, `useMutation`, `useInfiniteQuery`, response typing, and query key conventions.

API files by domain: `src/api/auth.ts`, `src/api/content.ts`, `src/api/exercises.ts`, `src/api/dictionary.ts`, `src/api/lessons.ts`.

---

## Route Structure

`src/app/AppRouter.tsx` holds top-level routes and mounts feature sub-routers from `src/app/routes/` (`ExercisesRoutes` at `/exercises/*`, `DictionaryRoutes` at `/dictionary/*`; paths inside are relative). Route guards live in `src/app/guards.tsx`:
- `AuthGuard` — wraps entire app; calls `fetchMe` on route change if token exists but user not loaded
- `PrivateRoute` — redirects to `/login` if not authenticated
- `GuestRoute` — redirects to `/` if already authenticated (used on `/login`)
- `LanguageGuard` — redirects to `/language-select` if user has no `nativeLanguage` set
- `ProtectedLayout` — layout route (`<Route element={<ProtectedLayout />}>`) = `PrivateRoute` + `LanguageGuard` + `<Outlet />`; wrap new private routes in it instead of nesting guards per route

| Route | Component | Notes |
|-------|-----------|-------|
| `/login` | `LoginPage` | GuestRoute |
| `/language-select` | `LanguageSelectPage` | PrivateRoute only |
| `/exercises/grammar` | `ExercisesPage` | Topics list |
| `/exercises/vocabulary` | `VocabularyPage` | |
| `/exercises/vocabulary/learn` | `LearnWordsSetupPage` | |
| `/exercises/vocabulary/learn/preview` | `LearnWordsPreviewPage` | |
| `/exercises/vocabulary/learn/session` | `LearnWordsSessionPage` | |
| `/exercises/vocabulary/learn/results` | `LearnWordsResultsPage` | |
| `/exercises/:topicId` | `TopicExercisesPage` | |
| `/exercises/session/:sessionId` | `SessionPage` | Active exercise session |
| `/exercises/results/:sessionId` | `SessionResultsPage` | |
| `/dictionary/my` | `MyDictionaryPage` | Supports `?collectionId=xxx` filter |
| `/dictionary/my-collections` | `CollectionsPage` | |
| `/dictionary/recommended-word-sets` | `WordSetsPage` | |
| `/dictionary/collections/:collectionId` | `CollectionPreviewPage` | |
| `/dictionary/practice/:sessionId` | `DictionaryPracticePage` | |
| `/dictionary/practice/results/:sessionId` | `DictionaryPracticeResultsPage` | |
| `/dictionary/review/:sessionId` | `DictionaryReviewPage` | FSRS revision session |
| `/dictionary/review/results/:sessionId` | `DictionaryReviewResultsPage` | |
| `/lessons` | `LessonsPage` | Lesson list with item chips |
| `/settings` | `SettingsPage` | |

---

## i18n

Languages: Russian (`ru`), Ukrainian (`uk`), English (`en`). Locale files in `src/i18n/`.

**Adding a new translation key**:
1. Add the key to all three locale files: `src/i18n/ru.json`, `src/i18n/uk.json`, `src/i18n/en.json`
2. Use in component: `const { t } = useTranslation(); t('my.key')`
3. Admin panel (`cro-admin`) does **not** use i18n — English only.
