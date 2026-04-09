# MVP Development Phases

## Feature Documentation

| Feature | Doc |
|---------|-----|
| Exercises — component contracts, Learn Words, AuthGuard gotcha | [docs/exercises.md](docs/exercises.md) |

---

## Phase 1 — Foundation ✅

- Initialize Turborepo monorepo with npm workspaces (`apps/api`, `apps/web`, `apps/admin`, `packages/shared`)
- ESLint + Prettier, Husky + lint-staged + commitlint at monorepo root, Docker Compose
- NestJS: ConfigModule + Prisma + Swagger
- Prisma migration (full schema)
- AuthModule: Google + Apple, email/password (admins), JWT, refresh in Redis
- Admin login page (email + password) + `AdminGuard`
- Vite + React + MUI for web and admin
- i18next (RU/UK/EN) in web and mobile (admin in English only)
- Redux + TanStack Query setup for web and admin
- Language selection screen (first login onboarding: set `nativeLanguage`) and setting in profile
- CORS configuration for cross-origin requests (web/admin on Vercel → API on Railway)
- Single CI pipeline (lint + typecheck + test via Turbo)

**Result**: Working Google/Apple login on web with language selection onboarding. Admin panel login with email/password.

## Phase 2 — Content + Exercise Engine (current)

- ContentModule (CRUD for ExerciseTopics + per-type exercise items + Redis cache)
- Database seed script (`prisma db seed`) — initial topics, exercise items (all 3 types), and default admin account (test@gmail.com / zxcv1234)
- Admin UI: topics management, tabbed exercise item management (3 tabs per topic), exercise type toggles
- Admin UI: "Add Admin" form (manage admin accounts from the panel)
- ProgressModule + item cycle logic (UserExerciseProgress with generic itemId)
- ExercisesModule: sessions, results processing, all 3 exercise types (Type the Answer, Flashcards, Fill-in-the-blank)
- Exercise screens on web for all 3 types (discriminated union ExerciseItem type)
- GamificationModule: XP + streak
- Unit tests: item cycle, results processing, streak
- DictionaryModule: personal word CRUD with cursor-based pagination, shared translation suggestions pool (per language), collections (admin-predefined + user-created)
- Dictionary practice sessions (Type the Answer mechanic with dictionary words), progress tracking (correctAttempts/totalAttempts)
- Admin UI: predefined dictionary collection management
- Web UI: My Dictionary page (`/dictionary/my`) with infinite scroll, Add Word modal with translation suggestions, Collections page (`/dictionary/collections`)
- Web UI: Dictionary practice page reusing TextInputExercise component

**Result**: All 3 exercise types working. Content created via admin panel with per-type item tables. Personal dictionary with word collection, shared translations, and practice mode.

## Phase 3 — Mobile App

**Step 1 — Add `cro-mobile` to monorepo & clean up Expo starter**

- Add `apps/mobile/` to the monorepo workspace
- ESLint + Prettier (shared config), CI via Turbo
- Remove example screens content (`explore.tsx` placeholder, `modal.tsx` demo)
- Remove example components (`HelloWave`, `ParallaxScrollView`, `Collapsible`, example assets)
- Update `app.json`: set `name` → "Croatian Grammar", `slug` → "croatian-grammar", `scheme` → "crogrammar"
- Keep useful components: `ThemedText`, `ThemedView`, `IconSymbol`, `HapticTab`, `ExternalLink`
- Keep theme system (`constants/theme.ts`, `useColorScheme`, `useThemeColor`)

**Expected result**: App launches with a clean Home tab showing "Croatian Grammar" title. No example/demo content remains. `npm run dev:mobile` from monorepo root starts without errors.

---

**Step 2 — Set up i18n (i18next + react-i18next)**

- Install `i18next`, `react-i18next`, `expo-localization`
- Create `i18n/` directory with `index.ts` config and `locales/` (en.json, ru.json, uk.json)
- Locale keys: `common.*`, `auth.*`, `nav.*`, `profile.*` (same structure as web app)
- Detect device language via `expo-localization`, fallback to `en`
- Initialize i18n in root `_layout.tsx`
- Replace hardcoded strings in tab labels and screens with `t()` calls

**Expected result**: App displays UI strings from locale files. Changing device language to RU/UK switches app strings accordingly. Fallback to English for unsupported languages.

---

**Step 3 — Set up Redux Toolkit store**

- Install `@reduxjs/toolkit`, `react-redux`
- Create `store/index.ts` with `configureStore`, typed hooks (`useAppDispatch`, `useAppSelector`)
- Create `store/auth.slice.ts` with `AuthState` (`user`, `isAuthenticated`), actions: `setUser`, `clearUser`
- Use `@cro/shared` `UserProfile` type for user state
- Wrap app with `<ReduxProvider>` in root `_layout.tsx`

**Expected result**: Redux store initializes on app launch. Auth slice is accessible via `useAppSelector`. No UI changes yet — state layer is ready for auth integration.

---

**Step 4 — Set up TanStack Query + axios API client**

- Install `@tanstack/react-query`, `axios`, `expo-secure-store`
- Create `api/client.ts` with axios instance (baseURL from env/constants)
- Add request interceptor: attach access token from `expo-secure-store`
- Add response interceptor: on 401, attempt token refresh via `/auth/refresh`, retry original request; on failure, clear tokens and set `isAuthenticated = false`
- Create `api/query-client.ts` with `QueryClient` (staleTime: 5 min, retry: 1)
- Wrap app with `<QueryClientProvider>` in root `_layout.tsx`

**Expected result**: API client is configured and exported. Token storage uses secure native storage (not AsyncStorage). Automatic 401 → refresh → retry flow is in place. `npx turbo run typecheck --filter=cro-mobile` passes.

---

**Step 5 — Set up auth navigation layout (auth vs main groups)**

- Restructure Expo Router groups:
  - `app/(auth)/` — unauthenticated screens: `login.tsx`
  - `app/(tabs)/` — authenticated screens: `index.tsx` (Home), `exercises.tsx`, `profile.tsx`
- Update root `_layout.tsx`: read `isAuthenticated` from Redux store, redirect to `/(auth)/login` or `/(tabs)` accordingly
- Configure 3-tab bottom navigation: Home, Exercises, Profile (with i18n labels from `nav.*` keys)
- Add tab icons using `IconSymbol` component

**Expected result**: App shows login screen by default (unauthenticated state). Manually setting `isAuthenticated = true` in Redux shows the 3-tab layout. Navigation between tabs works. Tab labels display in the current locale language.

---

**Step 6 — Create login screen (Google + Apple sign-in buttons)**

- Create `app/(auth)/login.tsx` with app logo, welcome text, and two sign-in buttons
- Style buttons: "Sign in with Google" and "Sign in with Apple" (Apple button only on iOS via `expo-apple-authentication` availability check)
- Use i18n keys `auth.signInWithGoogle`, `auth.signInWithApple` for button labels
- Buttons are non-functional placeholders (onPress logs to console) — API connection in next step

**Expected result**: Login screen shows app name, welcome message, and sign-in buttons. Apple button only appears on iOS. Text is translated based on device language. UI is clean and themed (light/dark mode supported).

---

**Step 7 — Connect auth to API (Google + Apple OAuth flow + token storage)**

- Install `expo-auth-session`, `expo-web-browser`, `expo-crypto`, `expo-apple-authentication`
- Implement Google OAuth flow: `useAuthRequest` (via `expo-auth-session`) + `expo-web-browser` → open Google consent screen → receive auth code → send to `POST /auth/google` → receive JWT tokens
- Implement Apple Sign-In: `expo-apple-authentication` → receive identity token → send to `POST /auth/apple` → receive JWT tokens (iOS only)
- Store `accessToken` and `refreshToken` in `expo-secure-store`
- Dispatch `setUser` action with user profile from API response
- On logout: call `POST /auth/logout`, clear tokens from secure store, dispatch `clearUser`
- Add "Sign out" button to Profile tab screen
- Handle deep link redirect after OAuth (`scheme` in `app.json`)

**Expected result**: Tapping "Sign in with Google" opens Google consent screen via `expo-web-browser`. Tapping "Sign in with Apple" (iOS) opens native Apple Sign-In dialog. After successful auth, user lands on the Home tab with their profile loaded. Tokens are stored securely. App persists auth state across restarts (checks secure store on launch). Sign out returns to login screen. `npx turbo run typecheck --filter=cro-mobile` passes.

---

**Step 8 — Exercise screens on mobile (all 3 types already implemented in Phase 2)**

- Port all 3 exercise type screens from web to mobile (Type the Answer, Flashcards, Fill-in-the-blank)
- All backend endpoints and item tables already exist from Phase 2

**Result**: All 3 exercise types working on mobile.

---

**Step 9 — Exercise screens + gamification on mobile**

- Exercise screens for all 3 exercise types (port from web)
- Gamification display: XP + streak in tab bar

**Result**: Mobile app with auth, exercises, and gamification — ready for subscriptions.

## Phase 4 — Subscriptions + Payments

- SubscriptionsModule + trial
- CurrencyMiddleware (geoip-lite)
- PaymentsModule: Stripe Checkout, portal, webhooks
- RevenueCatModule: webhooks + HMAC
- `react-native-purchases` (RevenueCat mobile SDK)
- Paywall screens on web and mobile
- Pricing UI in admin
- Push: trial expiry warnings (BullMQ + `expo-notifications`)

**Result**: Full monetization cycle on all platforms (web + mobile).

## Phase 5 — Notifications + Analytics + Polish

- BullMQ: daily reminders + trial expiry jobs
- Admin analytics: registration and subscription charts
- Admin: user management (view, block)
- Sentry in all 4 apps
- Performance: Redis content cache, TanStack Query tuning
- Test coverage improvements
- E2e tests: login, exercise session, subscription purchase
- Manual testing + Expo Go for mobile
- Staging deploy + smoke test
- Production deploy (API, web, admin) + EAS Build + EAS Submit

**Result**: Release-ready MVP on all platforms (web + mobile).
