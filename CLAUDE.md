# Croatian Grammar — MVP

An application for learning Croatian grammar through interactive exercises. Target platforms: Android, iOS, Web, and Admin Panel (web only). MVP with subscription, trial period, and gamification system.

## Documentation Map

| File | Contents |
| ---- | -------- |
| `apps/api/CLAUDE.md` | DB schema, NestJS modules, all API endpoints, item cycle logic, Prisma commands |
| `apps/admin/CLAUDE.md` | Admin auth (login, credentials, security), content management UI |
| `apps/web/CLAUDE.md` | Web app patterns, dictionary UI specifics |
| `packages/shared/CLAUDE.md` | Exercise types, dictionary domain, payment architecture, gamification |
| `ROADMAP.md` | MVP development phases (1-5) |

---

## Technology Stack

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| Monorepo           | Turborepo + npm workspaces                |
| Shared code        | Local workspace package (`@cro/shared`)   |
| Web + Admin UI     | React.js + TypeScript + Material UI (MUI) |
| Mobile             | Expo Go (React Native) + Expo Router      |
| Backend            | NestJS + TypeScript (Node.js 24 LTS)      |
| Database           | PostgreSQL + Prisma ORM                   |
| Cache / Queues     | Redis + BullMQ                            |
| State              | Redux Toolkit + TanStack Query            |
| Forms              | React Hook Form + Zod                     |
| i18n               | i18next + react-i18next (cro-web + cro-mobile only; cro-admin uses English only) |
| Auth (Students)    | Passport.js (Google OAuth2 + Apple) + JWT |
| Auth (Admin)       | Email/password (bcrypt) + JWT             |
| Auth (Mobile)      | expo-auth-session + expo-web-browser + expo-crypto + expo-apple-authentication |
| Web Payments       | Stripe (Checkout + Customer Portal)       |
| Mobile Payments    | RevenueCat (App Store + Google Play IAP)  |
| Push Notifications | Expo Notifications + BullMQ               |
| Frontend Tests     | Jest + React Testing Library              |
| Backend Tests      | Node.js `node:test` (built-in)            |
| Linting            | ESLint (eslint-config-airbnb) + Prettier  |
| Pre-commit         | Husky + lint-staged (runs tests)          |
| Error Monitoring   | Sentry                                    |
| API Deploy         | Railway (PostgreSQL + Redis included)     |
| Web/Admin Deploy   | Vercel                                    |
| Mobile Dev         | Expo Go                                   |
| Mobile Deploy      | Expo EAS Build + EAS Submit               |

---

## Repository Structure

The project is a **Turborepo monorepo** with npm workspaces. All apps and shared code live in a single Git repository.

```
cro/                              # monorepo root
├── .github/
│   └── workflows/
│       └── ci.yml                # single CI: lint + typecheck + test (all apps via Turbo)
├── .husky/
│   ├── pre-commit                # runs lint-staged
│   └── commit-msg                # commitlint (Conventional Commits)
├── apps/
│   ├── api/                      # NestJS backend (cro-api)
│   │   ├── src/
│   │   │   ├── modules/          # feature modules (see below)
│   │   │   ├── common/           # guards, interceptors, decorators
│   │   │   ├── config/           # ConfigModule + env validation via zod
│   │   │   └── prisma/           # PrismaService + schema.prisma
│   │   ├── eslint.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                      # React app for students (cro-web)
│   │   ├── src/
│   │   │   ├── app/              # providers, routing
│   │   │   ├── features/         # auth, exercises, progress, subscription
│   │   │   ├── store/            # Redux store + RTK slices
│   │   │   ├── api/              # TanStack Query hooks + axios client
│   │   │   └── i18n/             # Russian/Ukrainian/English locales
│   │   ├── eslint.config.mjs
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── admin/                    # React admin panel (cro-admin)
│       ├── src/
│       │   ├── features/         # auth, content-mgmt, users, analytics, pricing
│       │   ├── store/            # Redux store + RTK slices
│       │   └── api/              # TanStack Query hooks + axios client
│       ├── eslint.config.mjs
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   └── shared/                   # @cro/shared — shared TS types, constants, utilities
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml            # postgres + redis for local development
├── turbo.json                    # Turborepo task pipeline config
├── commitlint.config.js
├── package.json                  # root: workspaces, Turbo scripts, Husky, lint-staged
└── .nvmrc                        # Node 24 LTS
```

### Workspace packages

| Package        | Name         | Path               |
| -------------- | ------------ | -------------------|
| API            | `cro-api`    | `apps/api/`        |
| Web            | `cro-web`    | `apps/web/`        |
| Admin          | `cro-admin`  | `apps/admin/`      |
| Shared         | `@cro/shared`| `packages/shared/` |

### `cro-mobile` — Expo app (not yet migrated to monorepo)

Mobile app will be added as `apps/mobile/` in Phase 3.

---

## Pre-commit Hooks

Single `.husky/pre-commit` at the monorepo root runs `lint-staged`. Lint-staged config in root `package.json` routes files to the correct app's ESLint config:

```bash
# .husky/pre-commit -> npx lint-staged

# Root package.json lint-staged config:
apps/api/src/**/*.ts:
  - eslint --config apps/api/eslint.config.mjs --fix --max-warnings=0
  - prettier --write

apps/web/src/**/*.{ts,tsx}:
  - eslint --config apps/web/eslint.config.mjs --fix --max-warnings=0
  - prettier --write

apps/admin/src/**/*.{ts,tsx}:
  - eslint --config apps/admin/eslint.config.mjs --fix --max-warnings=0
  - prettier --write
```

Commitlint enforces Conventional Commits via `.husky/commit-msg` → `npx commitlint --edit`.

---

## Testing Strategy

### Backend (`node:test`)

Priorities:

1. `ProgressService` — word cycle logic
2. `ExercisesService` — results processing, XP calculation
3. `GamificationService` — streak, XP
4. `PaymentsService` — webhook idempotency
5. `AdminAuthService` — login, password hashing, token generation

### Frontend (Jest + React Testing Library)

Priorities:

1. Exercise components — input, result
2. Auth flow
3. Paywall — trial / plan display
4. Redux slices

### Coverage (MVP)

- Backend services: 70% lines
- Frontend features: 60% lines
- Mobile: manual testing + Expo Go

---

## Deploy (MVP)

| Component   | Platform                                      |
| ----------- | --------------------------------------------- |
| NestJS API  | Railway (includes managed PostgreSQL + Redis) |
| PostgreSQL  | Railway managed                               |
| Redis       | Railway managed                               |
| Web app     | Vercel                                        |
| Admin panel | Vercel (separate project)                     |
| Mobile      | Expo EAS Build + EAS Submit                   |
| Mobile dev  | Expo Go (scan QR code)                        |
| Local dev   | Docker Compose (postgres:5434 + redis:6379)   |

### EAS Mobile CI/CD

```json
// eas.json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  }
}
```

OTA updates via `expo-updates` for JS changes without resubmitting to stores.

---

## Additional Libraries

| Library                                                     | Purpose                                             |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `zod`                                                       | env variable validation + form schemas              |
| `react-hook-form`                                           | frontend forms                                      |
| `date-fns`                                                  | date handling                                       |
| `geoip-lite`                                                | country detection by IP -> currency                 |
| `class-validator` + `class-transformer`                     | NestJS DTO validation                               |
| `@nestjs/swagger`                                           | automatic API documentation                         |
| `@nestjs/throttler`                                         | rate-limiting                                       |
| `helmet`                                                    | security headers                                    |
| `bcrypt`                                                    | password hashing for admin accounts                 |
| `passport-google-oauth20` + `passport-apple`                | OAuth strategies                                    |
| `@nestjs/jwt`                                               | JWT tokens                                          |
| `stripe` (Node SDK)                                         | Stripe API                                          |
| `@stripe/stripe-js` + `@stripe/react-stripe-js`             | Stripe frontend                                     |
| `react-native-purchases`                                    | RevenueCat mobile SDK                               |
| `expo-auth-session`                                         | OAuth flow for mobile (Google)                      |
| `expo-web-browser`                                          | in-app browser for OAuth redirects                  |
| `expo-crypto`                                               | PKCE code verifier/challenge for OAuth              |
| `expo-apple-authentication`                                 | native Apple Sign-In on iOS                         |
| `expo-notifications`                                        | push notifications                                  |
| `winston` or `pino`                                         | structured logging                                  |
| `@sentry/nestjs` + `@sentry/react` + `@sentry/react-native` | error monitoring                                    |
| `commitlint`                                                | Conventional Commits                                |

---

## Verification (How to Check Everything Works)

1. `docker compose up -d` -> `npm run dev` (runs all apps via Turbo) -> all apps start without errors
2. Log in via Google on web -> land on language selection screen -> choose language -> redirected to home
3. Browse topics, select a topic, choose exercise type -> start session -> answer items -> verify XP earned
4. Complete all items in a topic for an exercise type -> confirm the cycle resets when user confirms reset
5. Streak: log in on two consecutive days -> confirm streak = 2
6. Open paywall -> create a Stripe Checkout session -> complete test payment -> confirm status changed to ACTIVE
7. Log in to admin panel with default credentials (see `apps/admin/CLAUDE.md`) -> land on admin dashboard
8. Add a new admin account via "Add Admin" form -> log out -> log in with the new account -> confirm access works
9. Admin: create a topic -> add items (all 3 types) -> enable exercise types -> confirm items appear in the student app
10. Admin: change subscription price -> confirm new price is displayed in the app
11. `npm test` at monorepo root -> all tests pass (via Turbo)
12. `npm run lint` and `npm run typecheck` at monorepo root -> no errors (via Turbo)
13. Add a word to dictionary -> verify it appears in the word list with infinite scroll
14. Search for an existing word -> verify translation suggestions from shared pool appear (filtered by nativeLanguage)
15. Create a personal collection -> assign words to it -> verify collection filter works on My Dictionary page
16. Start dictionary practice -> answer all items -> verify progress % updates in the word list
17. Admin: create a predefined dictionary collection -> verify it appears for all users on Collections page

---

## Local Development Setup

### Prerequisites

- **Node.js 24 LTS** — `nvm install` (reads `.nvmrc`)
- **Docker** — for PostgreSQL and Redis containers

### Quick start

```bash
git clone <repo-url> && cd cro
npm install
docker compose up -d
npm run -w cro-api prisma:migrate
npm run dev
```

### Environment

Copy `apps/api/.env.example` to `apps/api/.env` and fill in:
- `DATABASE_URL`, `REDIS_URL` — already set for local Docker
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any random strings (min 16 chars)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` — from Google Cloud Console

### App URLs

| App                | URL                            |
| ------------------ | ------------------------------ |
| API (NestJS)       | http://localhost:3000           |
| API Docs (Swagger) | http://localhost:3000/api/docs  |
| Web app            | http://localhost:5173           |
| Admin panel        | http://localhost:5174           |

### Turbo commands (from monorepo root)

```bash
npm run dev              # all apps
npm run dev:api          # API only
npm run dev:web          # Web only
npm run dev:admin        # Admin only
npm run lint             # ESLint — all apps
npm run typecheck        # TypeScript — all apps
npm test                 # Tests — all apps
npm run format           # Prettier on all files
```
