# Plan: Web app — MUI → Tailwind CSS + shadcn/ui

**Intent:** `docs/intent/adr-001-web-mui-to-tailwind-shadcn.md`
**Date:** 2026-09-17

Each phase is one PR that converts a whole feature folder (ADR invariant #2). Baseline at start: 64 files importing `@mui/material`, 451 `sx={}` props in 55 files, 53 distinct MUI components, 38 icons.

## Implementation phases

### Phase 1: Foundation + app shell + auth (tracer bullet)

**Goal:** New stack wired end-to-end (build, lint, jest), design tokens defined, and the first screens migrated so every later PR only touches feature files.
**Affects:** frontend (`apps/web`), docs
**Tasks:**

- [x] Tailwind v4 via `@tailwindcss/vite`; `@/` alias in `vite.config.ts`, `tsconfig*.json`, `jest.config.cjs`; `import-x/internal-regex` for `@/`; `prettier-plugin-tailwindcss`
- [x] `npx shadcn init` (`base-nova` preset, Base UI, css variables) → `components.json`, `src/styles/globals.css`, `src/lib/utils.ts`
- [x] Tokens: brand blue as `--primary`, `#0f172a` as `--foreground`, plus project colours `success`, `xp*`, `streak*` in `@theme`
- [x] Primitives added to `src/components/ui/`: button, input, label, card, alert, separator, dropdown-menu, avatar, skeleton, sonner, dialog, alert-dialog, badge, progress, checkbox, select, switch, toggle-group, table
- [x] Shared blocks: `Spinner`, `PageContainer`, brand SVG icons (`src/assets/icons/`, incl. `GoogleIcon`)
- [x] Shell: `AppRouter` layout + `<Toaster />`, `Header` + 4 menus (click-driven `DropdownMenu`), `Footer`, `QueryState`
- [x] Auth: `LoginPage`, `EmailAuthForm`, `LanguageSelectPage` (+ shared `AuthLayout`); `@mui/lab` removed
- [x] `Providers.tsx` no longer mounts `ThemeProvider` / `CssBaseline`
- [x] `jest.setup.ts` shim for Floating UI's `:modal` probe (jsdom perf), `Header.test.tsx`
- [x] Docs: ADR amended, root + web `CLAUDE.md`, `ui-ux-playwright-reviewer` agent made stack-aware

**Done when:** `grep -rn "@mui" src/app src/components src/shared src/features/auth` is empty; lint/typecheck/tests green.

### Phase 2: Exercises core

**Goal:** The session flow (the most used screens) on the new stack.
**Affects:** frontend
**Tasks:**

- [x] `features/exercises/SessionPage.tsx` (now reuses `StopExerciseDialog` instead of an inline copy), `ExerciseProgressHeader.tsx` (`LinearProgress` → `Progress`)
- [x] Dialogs: `StopExerciseDialog`, `CycleResetDialog` → `AlertDialog`; `ExerciseRulesDialog` → `Dialog` + `[&_h1]…[&_blockquote]` prose classes for admin-authored HTML
- [x] `ExercisesPage`, `TopicExercisesPage/`, `SessionResultsPage` (`Skeleton`, `Card`, `Grid` → `grid-cols`)
- [x] Shared blocks added for the recurring patterns: `src/components/ErrorAlert.tsx` (`Alert severity="error"` + optional action) and `src/components/EmptyState.tsx` (icon disc + title + description)
- [x] `SessionResultsPage.test.tsx`

**Done when:** `grep -rln "@mui" src/features/exercises` lists only exercise-type components and LearnWords/SpeedQuiz pages.

### Phase 3: Exercise components

**Goal:** All six exercise types + SpeedQuiz + LearnWords pages migrated; MUI-specific test assertions rewritten.
**Affects:** frontend
**Tasks:**

- [x] Shared exercise blocks in `src/features/exercises/ui/`: `ExerciseCard` (elevated card + success/warning ring), `ExerciseFeedback` (fixed-height check/cross slot), `ExerciseActionButton` (full-width dark Check/Next)
- [x] `TextInputExercise`, `TypeTheAnswerExercise`, `FillInBlankExercise`, `FlashcardExercise`, `LetterPickExercise`, `MatchingExercise`, `DictionaryReviewExercise`, `BuildSentenceExercise/*` (deletable `Chip` → `Badge` + "Undo" button; new `common.undo` i18n key)
- [x] `SpeedQuiz/*` (`useSpeedQuiz` now returns `timerClassName` instead of an MUI palette string), `LearnWords/*` (`ToggleButtonGroup` → `ToggleGroup`), `VocabularyPage` (rows extracted into a local `ModeCard`)
- [x] Tests: `WordProgressRow.test.tsx` / `BuildSentenceExercise.test.tsx` query `getByRole('button', { name: 'Undo' })`; `SpeedQuizCard.test.tsx` asserts `data-result="correct|wrong"`

**Done when:** `src/features/exercises` has no `@mui` imports; all exercise tests pass. ✅

### Phase 4: Dictionary

**Goal:** Dictionary pages migrated, including the virtualized list and modals.
**Affects:** frontend
**Tasks:**

- [ ] `MyDictionaryPage/*`: `DictionaryTopBar` (`Select`), `DictionaryBatchActions` (`Select` with placeholder), `DictionaryWordList` (`@tanstack/react-virtual` stays; `Box` → `div`), `WordRow` (`Checkbox` `onChange` → `onCheckedChange`, `Progress`), `DeleteWordDialog` → `AlertDialog`
- [ ] `AddWordModal`, `EditWordModal`, `CreateCollectionModal` → `Dialog` + `Label`/`Input`/`Select`
- [ ] `CollectionPreviewPage` (`Table`, `Snackbar` → `toast()` from sonner), `CollectionsPage`, `WordSetsPage`
- [ ] `DictionaryPractice/*`, `Review/*`

**Done when:** `src/features/dictionary` has no `@mui` imports.

### Phase 5: Remaining pages

**Goal:** Everything else.
**Affects:** frontend
**Tasks:**

- [ ] `home/HomePage`
- [ ] `lessons/LessonsPage`, `settings/SettingsPage` (`Switch`, `ToggleGroup`)

**Done when:** `grep -r "@mui" apps/web/src` returns nothing.

### Phase 6: Cleanup

**Goal:** Remove the old stack and record the win.
**Affects:** frontend, docs
**Tasks:**

- [ ] `npm uninstall -w cro-web @mui/material @mui/icons-material @emotion/react @emotion/styled`
- [ ] Remove the "migration in progress" notes from `apps/web/CLAUDE.md` and the reviewer agent
- [ ] Bundle size before/after in the PR description (baseline: `dist/assets/index-*.js` ≈ 1.12 MB / 346 kB gzip with both stacks loaded)
- [ ] Consider `npx shadcn eject` if the `shadcn` runtime dependency is unwanted

**Done when:** ADR-001 invariant #5 holds.

## Migration recipe (apply in every phase)

**Layout / text**

| MUI | Tailwind |
| --- | --- |
| `Box sx={{ display:'flex', gap:2, p:3 }}` | `<div className="flex gap-4 p-6">` (1 MUI unit = 8px = Tailwind `2`) |
| `Container maxWidth="sm/md/lg"` | `<PageContainer size="sm/md/lg">` |
| `Grid container spacing={2}` + `Grid size={{ xs:12, sm:6, md:4 }}` | `grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3` |
| `Stack spacing={1}` | `flex flex-col gap-2` |
| `Typography h3/h4/h5/h6` | `text-4xl/3xl/2xl/lg font-semibold` |
| `subtitle1/subtitle2` | `font-medium` / `text-sm font-medium` |
| `body1/body2/caption` | `text-base` / `text-sm` / `text-xs text-muted-foreground` |
| `color: 'text.secondary'` | `text-muted-foreground` |
| `borderColor: 'divider'` | `border-border` (default) |
| `bgcolor: 'grey.100'` | `bg-muted` / `bg-neutral-100` |
| `color: 'error.main'` | `text-destructive` |
| `#16a34a`, `#f59e0b`, `#f97316` | `success`, `xp`, `streak` tokens |
| `Divider` | `Separator` |
| `Paper` | `Card` (or `rounded-xl border bg-card`) |

**Components**

| MUI | shadcn |
| --- | --- |
| `Button variant="contained/outlined/text"` | `Button variant="default/outline/ghost"` |
| `LoadingButton loading` | `Button disabled` + `<Loader2Icon className="animate-spin" />` |
| `IconButton` | `Button variant="ghost" size="icon"` + `aria-label` |
| `Button component={RouterLink}` | `<Link className={buttonVariants({ variant })}>` |
| `Alert severity="error"` | `<ErrorAlert message action />` (`src/components/ErrorAlert.tsx`) |
| `Alert severity="info/success/warning"` | `Alert` + icon + `AlertTitle` |
| Empty-state block (grey icon disc + title + text) | `<EmptyState icon title description />` |
| `Dialog` (confirm) | `AlertDialog` |
| `Dialog` (form / content) | `Dialog` + `DialogHeader/Footer` |
| `Menu` + anchor state | `DropdownMenu`; items navigate via `render={<Link to=… />}` |
| `Select` + `FormControl` + `InputLabel` | `Label` + `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` |
| `TextField label` | `Label htmlFor` + `Input id` (keeps `getByLabelText` working) |
| `Checkbox onChange` | `Checkbox onCheckedChange` |
| `Switch` | `Switch onCheckedChange` |
| `ToggleButtonGroup` | `ToggleGroup` / `ToggleGroupItem` |
| `Chip` / `Chip onDelete` | `Badge` / `Badge` + `<button aria-label="Remove …"><XIcon/></button>` |
| `LinearProgress` | `Progress` |
| `CircularProgress` | `Spinner` |
| `Skeleton` | `Skeleton` |
| `Snackbar` | `toast()` from `sonner` |
| `Table*` | `Table*` |
| `CardActionArea` | `<button>` or `<Link>` with `hover:` classes |
| `Avatar` | `Avatar` + `AvatarImage` + `AvatarFallback` |
| `@mui/icons-material/X` | `lucide-react` `XIcon` (brand marks: `src/assets/icons`) |

**Rules**

- Never use `sx`, `style={{}}` for static values, or hex colours that already have a token.
- Class order is enforced by `prettier-plugin-tailwindcss`; run Prettier before lint.
- Tests: query by role/label/text; jsdom cannot compute Tailwind styles, so never assert `toHaveStyle` on class-driven colours — assert `toHaveClass` or `data-*` state.
