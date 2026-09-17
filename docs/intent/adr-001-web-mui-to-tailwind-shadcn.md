# ADR-001: Web app — migrate from Material UI to Tailwind CSS + shadcn/ui

- **Status**: Accepted — **implemented** (all 6 phases, 2026-09-17)
- **Date**: 2026-09-14
- **Scope**: `apps/web` (`cro-web`) only
- **Implementation**: phase plan in `docs/plan-web-tailwind-migration.md`. No separate PRD — this ADR already fixes requirements and non-goals.
- **Amended**: 2026-09-17 — Base UI primitives instead of Radix; header menus become click-driven (see Decision)

## Context

`cro-web` is built on Material UI v7 (`@mui/material`, `@mui/icons-material`, `@mui/lab`) with Emotion. Current footprint (as of this ADR):

- 65 of 83 `.tsx` files import from `@mui/*`
- ~450 `sx={...}` usages; no `styled()` usage
- Custom theme is minimal: `Providers.tsx` overrides only `primary` / `secondary` colors
- `@mui/lab` is used in 2 files (`LoadingButton` in `LoginPage`, `EmailAuthForm`)
- `@cro/shared` has **no** MUI dependency — the migration is fully contained in `apps/web`

Pain points driving the decision:

1. **Styling model.** Nearly all layout lives in ad-hoc `sx` objects — no reusable design tokens, hard to keep visual consistency, and MUI's default look is hard to move away from (`docs/design-web.md` explicitly tells the designer not to be constrained by MUI, but the code is).
2. **Bundle & runtime cost.** Emotion runtime CSS-in-JS on every render; MUI + icons + lab is a heavy dependency set for a mobile-first student app.
3. **AI-native workflow.** shadcn/ui components are copied into the repo as source. Agents can read and modify them directly instead of reasoning about a black-box library API and theme overrides. Tailwind utility classes are explicit in the markup, which makes generated diffs reviewable.
4. **Mobile parity.** The planned Expo app (`apps/mobile`, Phase 3) will use NativeWind / Tailwind-style utilities. Sharing the token vocabulary (spacing, colors, radii) between web and mobile is much easier from Tailwind than from an MUI theme.

## Decision

`cro-web` moves to **Tailwind CSS v4 + shadcn/ui** (**Base UI** primitives — the current shadcn CLI default, `style: "base-nova"` — and `lucide-react` icons). MUI is removed from `apps/web` entirely once the migration completes.

Target setup (per current shadcn docs for Vite):

- `tailwindcss` + `@tailwindcss/vite` plugin; single global CSS entry (`src/styles/globals.css`) with `@import "tailwindcss"` and design tokens as CSS variables
- `components.json` at `apps/web/`; shadcn components generated into `src/components/ui/`
- `@/` path alias → `apps/web/src` (in `tsconfig` + `vite.config.ts` + `jest.config.cjs`)
- `cn()` helper in `src/lib/utils.ts` (re-export of shadcn's `cn` package — the CLI's replacement for `clsx` + `tailwind-merge`)
- Icons: `lucide-react` replaces `@mui/icons-material`; brand glyphs lucide lacks (Google, X, YouTube…) live in `src/assets/icons/`
- Font: Geist Variable (ships with the `nova` preset; has Latin-ext + Cyrillic, so Croatian diacritics and RU/UK are covered)
- Forms stay on plain `useState` + native validation (React Hook Form is installed but unused in web); shadcn `Label` + `Input`
- Toasts: `sonner` (`<Toaster />` mounted once in `AppRouter`) replaces the ad-hoc MUI `Snackbar`
- Composition: Base UI has no `asChild`; use `render={<Link to=… />}` on primitives, and `buttonVariants()` classes on a plain `<Link>` for navigation links (so they keep `role="link"`)

## Non-goals

- **`apps/admin` stays on MUI.** It is an internal tool; the cost of migrating it is not justified. A future ADR may revisit this.
- **No visual redesign in this migration.** The goal is technology parity: each migrated screen must look and behave the same (or trivially better) as the MUI version. Redesign per `docs/design-web.md` is a separate effort that builds on the new stack. Accepted parity deviations: the shadcn preset look (Geist font, radii, button hover), and the header "Exercises" / "Dictionary" menus open on **click** instead of hover (standard `DropdownMenu` behaviour, keyboard/touch accessible).
- **No changes to state, data fetching, routing, i18n, auth.** Redux Toolkit, TanStack Query, React Router, i18next, better-auth are untouched.
- **No changes to `@cro/shared`.**
- **No custom component library package.** shadcn components live in `apps/web/src/components/ui/`; they are not extracted into `packages/` until a second consumer exists.

## Alternatives considered

| Option | Why not |
| ------ | ------- |
| Stay on MUI, add a proper theme | Fixes consistency but not bundle cost, not the `sx` sprawl, not the mobile token sharing; agents still work against a library API |
| Mantine / Chakra | Same class of problem as MUI (runtime CSS-in-JS or heavy theme layer); no advantage over shadcn for agent-driven development |
| Tailwind without shadcn (hand-rolled components) | Loses accessible headless primitives (dialog, menu, select, checkbox); would re-implement what shadcn already ships as source |
| Migrate web and admin together | Doubles scope for an internal tool; admin has MUI-specific workarounds (label float fix) that would need re-solving for no user-facing gain |

## Consequences

**Positive**

- Design tokens live in one CSS file; visual consistency enforced by utilities, not by convention
- Smaller bundle, no runtime style injection
- UI components are project source — agents and humans edit them directly
- Same token vocabulary reusable in `apps/mobile` later

**Negative / costs**

- Two UI stacks in the monorepo (web: Tailwind+shadcn, admin: MUI) until/unless admin migrates. Skills and agents must be stack-aware per app.
- All 65 MUI-importing files in web must be touched; the migration is a multi-PR effort with a period of mixed MUI + Tailwind code
- `ExerciseRulesDialog` (renders admin-authored HTML) needs typography styles reproduced with Tailwind (`@tailwindcss/typography` or hand-written prose styles)
- Jest + RTL tests that assert on MUI class names or roles may need updating
- jsdom + Floating UI (inside Base UI popups) hit a selector-engine pathology (`:modal` → 20 s per menu open); `src/test-utils/jest.setup.ts` shims `Element.prototype.matches` for top-layer pseudo-classes

## Invariants during and after migration

These are rules for agents and reviewers. They apply from the moment this ADR is accepted, **before** the migration is complete.

1. **No new MUI in `apps/web`.** New components and new screens use Tailwind + shadcn only. Touching an existing MUI component to add a feature is allowed; adding new `@mui/*` imports is not.
2. **Migrate per screen/feature, not per component type.** A PR converts a whole page (or a cohesive feature folder) so that no page mixes MUI and Tailwind layout.
3. **Behavior parity is the acceptance criterion.** Existing Jest/RTL and Playwright e2e tests must pass unchanged in intent; if a test must change, the change is test-implementation only.
4. **`apps/admin` is out of scope.** No Tailwind, no shadcn in admin during this migration.
5. **Done means** `apps/web/package.json` has no `@mui/*` and no `@emotion/*`, and `grep -r "@mui" apps/web/src` returns nothing.

## Links

- Phase plan: `docs/plan-web-tailwind-migration.md`
- Designer-facing spec that motivated this: `docs/design-web.md`
