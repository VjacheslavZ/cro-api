<div align="center">

# 🇭🇷 Croatian Grammar

**Learn Croatian grammar and vocabulary through short, interactive exercises.**

Spaced-repetition dictionary · XP & streaks · Admin-managed content · Web, iOS & Android

[![CI](https://github.com/VjacheslavZ/CloudCodePractice/actions/workflows/ci.yml/badge.svg)](https://github.com/VjacheslavZ/CloudCodePractice/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-24%20LTS-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Turborepo](https://img.shields.io/badge/monorepo-Turborepo-EF4444?logo=turborepo&logoColor=white)
![NestJS](https://img.shields.io/badge/API-NestJS-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/UI-React%2019-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)

</div>

---

## What it does

|                            |                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📚 **Grammar exercises**   | Topics authored in the admin panel, each with rich-text grammar rules and three mechanics: _Type the Answer_, _Flashcards_, _Fill-in-the-blank_. Progress is tracked per item, and the cycle resets once every item in a topic has been seen. |
| 🗂️ **Personal dictionary** | Add Croatian words with translations in your native language (RU / UK / EN). Suggestions come from a shared translation pool. Group words into personal collections or use admin-curated word sets.                                           |
| 🧠 **Spaced repetition**   | Dictionary review sessions are scheduled by an FSRS-6 scheduler (`ts-fsrs`) — rate recall as _Again / Hard / Good / Easy_ and the next due date is computed per word.                                                                         |
| ⚡ **Vocabulary drills**   | _Learn Words_ flow (setup → preview → session → results) and a timed _Speed Quiz_.                                                                                                                                                            |
| 🏆 **Gamification**        | XP for every session and a daily streak that survives only if you show up tomorrow.                                                                                                                                                           |
| 💳 **Subscriptions**       | Trial period, then Stripe Checkout on web and RevenueCat (App Store / Google Play IAP) on mobile.                                                                                                                                             |
| 🛠️ **Admin panel**         | Topics, exercise items, dictionary collections, lessons, admin accounts and pricing — all managed without touching the database.                                                                                                              |

---

## Tech stack

| Layer           | Technology                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Monorepo        | Turborepo + npm workspaces                                                                               |
| Backend         | NestJS · Prisma · PostgreSQL · Redis + BullMQ · Swagger                                                  |
| Student web app | React 19 · Vite · Tailwind CSS v4 · shadcn/ui (Base UI) · Redux Toolkit · TanStack Query · i18next       |
| Admin panel     | React 19 · Vite · Material UI · Redux Toolkit · TanStack Query                                           |
| Mobile          | Expo (React Native) + Expo Router — _planned, Phase 3_                                                   |
| Auth            | better-auth (Google OAuth2, session cookies) for students · bcrypt + JWT for admins                      |
| Payments        | Stripe (web) · RevenueCat (mobile)                                                                       |
| Testing         | `node:test` (API) · Jest + React Testing Library (web / admin)                                           |
| Quality         | ESLint (airbnb) · Prettier · Husky + lint-staged · commitlint (Conventional Commits) · GitHub Actions CI |

---

## Repository layout

```
cro/
├── apps/
│   ├── api/        # NestJS backend — modules, guards, Prisma schema & migrations
│   ├── web/        # Student web app (Vite + React + Tailwind + shadcn/ui)
│   └── admin/      # Admin panel (Vite + React + MUI)
├── packages/
│   └── shared/     # @cro/shared — TS types, constants, utilities shared by all apps
├── docs/           # ADRs (docs/intent), PRDs, plans, feature docs
├── docker-compose.yml   # PostgreSQL (:5434) + Redis (:6379) for local dev
└── turbo.json      # Turborepo task pipeline
```

Each workspace has its own `CLAUDE.md` with the details that matter when you work inside it (DB schema and endpoints for the API, UI conventions for web, auth flow for admin).

---

## Quick start

**Prerequisites:** Node.js 24 LTS (`nvm install` reads `.nvmrc`), Docker.

```bash
git clone git@github.com:VjacheslavZ/CloudCodePractice.git cro && cd cro
npm install

cp apps/api/.env.example apps/api/.env      # fill in JWT secrets + Google OAuth credentials
docker compose up -d                        # PostgreSQL + Redis
npm run -w cro-api prisma:migrate           # apply migrations
npm run -w cro-api seed                     # sample topics, items, default admin

npm run dev                                 # all apps via Turbo
```

| App             | URL                            |
| --------------- | ------------------------------ |
| API             | http://localhost:3000          |
| Swagger docs    | http://localhost:3000/api/docs |
| Student web app | http://localhost:5173          |
| Admin panel     | http://localhost:5174          |

Default admin credentials are created by the seed script — see `apps/admin/CLAUDE.md`.

---

## Scripts

All commands run from the monorepo root and fan out through Turbo.

| Command                                     | What it does                                |
| ------------------------------------------- | ------------------------------------------- |
| `npm run dev`                               | Start every app in watch mode               |
| `npm run dev:api` / `dev:web` / `dev:admin` | Start a single app                          |
| `npm run build`                             | Production build of all workspaces          |
| `npm run lint`                              | ESLint across all apps (`--max-warnings=0`) |
| `npm run typecheck`                         | `tsc --noEmit` across all apps              |
| `npm test`                                  | Run all test suites                         |
| `npm run format`                            | Prettier on `**/*.{ts,tsx,json,md}`         |
| `npm run prisma:generate`                   | Regenerate the Prisma client                |
| `npm run check-deps`                        | `npm audit` + `npm outdated`                |

Pre-commit runs `lint-staged` (ESLint `--fix` + Prettier on staged files); commit messages are validated by commitlint.

---

## Documentation

| Document                                                 | Contents                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| [`ROADMAP.md`](ROADMAP.md)                               | MVP phases 1–5 and what each one delivers                            |
| [`docs/intent/`](docs/intent/README.md)                  | Architecture Decision Records — the _why_ behind non-obvious choices |
| [`docs/exercises.md`](docs/exercises.md)                 | Exercise component contracts, Learn Words flow, FSRS revision        |
| [`docs/design-web.md`](docs/design-web.md)               | Web app screens and design system                                    |
| [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)               | DB schema, NestJS modules, every API endpoint, item-cycle logic      |
| [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md)               | Web app conventions, route map, UI stack                             |
| [`apps/admin/CLAUDE.md`](apps/admin/CLAUDE.md)           | Admin auth and content-management UI                                 |
| [`packages/shared/CLAUDE.md`](packages/shared/CLAUDE.md) | Exercise types, dictionary domain, payments, gamification            |

---

## Deployment

| Component                | Platform                    |
| ------------------------ | --------------------------- |
| API + PostgreSQL + Redis | Railway                     |
| Web app / Admin panel    | Vercel (separate projects)  |
| Mobile                   | Expo EAS Build + EAS Submit |

CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests against a real PostgreSQL 17 + Redis on every push and pull request to `main`.
