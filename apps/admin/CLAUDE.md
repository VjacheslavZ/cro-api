# cro-admin — React Admin Panel

English-only UI (no i18n). Vite + React + Material UI (MUI).

For exercise type definitions and domain models, see `packages/shared/CLAUDE.md`.

---

## Authentication

### Overview

The admin panel uses a separate email/password authentication system, independent of student OAuth. Admin credentials are stored in a dedicated `Admin` table (not the `User` table). There is no self-registration — new admin accounts can only be created by an already authenticated admin.

### Login flow

1. Admin enters email + password on the login page
2. `POST /admin/auth/login` → backend verifies credentials (bcrypt compare)
3. On success, backend returns JWT access + refresh tokens with `type: "admin"` claim
4. `AdminGuard` checks the `type: "admin"` claim on every protected admin endpoint
5. Refresh flow works identically to student auth (`POST /admin/auth/refresh`), with tokens stored in Redis

### Adding new admins

Authenticated admins can add new admin accounts via the "Add Admin" form in the admin panel:

- **Fields**: email, password, confirm password
- **Validation**: valid email format, password min 8 characters, passwords match
- **Endpoint**: `POST /admin/admins` (protected by `AdminGuard`)

### Default credentials

| Email            | Password   | Notes                                  |
| ---------------- | ---------- | -------------------------------------- |
| test@gmail.com   | zxcv1234   | Seeded via `prisma db seed`            |

The default admin account is created automatically when running the seed script. Change credentials in production.

### Security notes

- Passwords are hashed with **bcrypt** (cost factor 10) before storage
- `@nestjs/throttler` rate-limits login attempts to prevent brute force
- Refresh tokens are stored in **Redis** with 30-day TTL (same as student tokens)
- Admin JWTs include `type: "admin"` claim — `AdminGuard` rejects tokens without this claim

---

## Content Management UI

### Content structure

Admin manages content as flat **ExerciseTopic** entities. Each topic can have multiple exercise types enabled, and each exercise type has its own dedicated item table with type-specific fields.

### Topic management

- **List view**: table with columns — name (English), enabled exercise types (chip badges), `sortOrder`, `isActive` toggle, edit/delete actions. Clicking a row navigates to the exercise items page for that topic.
- **Create/Edit form**: `nameHr`, `nameRu`, `nameUk`, `nameEn`, `sortOrder` (number input), `isActive` (checkbox, default: true)
- **Delete**: block deletion if topic has any items (show error)

### Exercise items management

- **Route**: `/topics/:topicId/items` — tabbed interface with one tab per exercise type
- **Exercise type toggles**: switch controls at the top of the page to enable/disable each exercise type for the topic (maps to `ExerciseTopicType` records via `PATCH /admin/topics/:id/exercise-types`)
- **Tabs**: Type the Answer, Flashcards, Fill in the Blank — each tab shows a table of items with inline create/edit forms

#### Type the Answer items
- Fields: `baseForm`, `pluralForm`, `translationRu`, `translationUk`, `translationEn`, `sortOrder`

#### Flashcard items
- Fields: `frontText`, `translationRu`, `translationUk`, `translationEn`, `sortOrder`

#### Fill in the Blank items
- Fields: `sentenceHr` (with `{{BLANK}}` placeholder), `blankAnswer`, `translationRu`, `translationUk`, `translationEn`, `sortOrder`

### Dictionary collection management (admin)

- **Route**: `/dictionary-collections` — table with columns: name, description, word count, sortOrder, edit/delete actions
- **Create/Edit form**: `name`, `description` (optional), `sortOrder`
- Admin-created collections have `isPublic: true` and are visible to all users as predefined collections
