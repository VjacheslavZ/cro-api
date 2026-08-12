# cro-api — NestJS Backend

## Database Schema (PostgreSQL + Prisma)

### Key Entities

```
User
  id, email, name, avatarUrl, role (STUDENT|ADMIN)
  nativeLanguage (RU|UK|EN)
  googleId, appleId
  xpTotal, currentStreak, longestStreak, lastPracticeDate
  expoPushToken
  isBlocked
  createdAt, updatedAt

SubscriptionPlan             <- configured via admin panel
  name, intervalMonths (1|12)
  priceEur, priceUsd
  stripePriceIdEur, stripePriceIdUsd
  rcProductIdIos, rcProductIdAndroid

Subscription
  userId (1:1 with User)
  planId, platform (STRIPE|APP_STORE|GOOGLE_PLAY)
  status (TRIALING|ACTIVE|PAST_DUE|CANCELED|EXPIRED)
  currency (EUR|USD)
  trialStartedAt, trialEndsAt
  currentPeriodStart, currentPeriodEnd
  stripeCustomerId, stripeSubscriptionId
  rcOriginalAppUserId
  createdAt, updatedAt

WebhookEvent                 <- idempotent processing
  source ("stripe"|"revenuecat")
  externalEventId @unique    <- idempotency key
  payload (Json)

ExerciseTopic                <- flat top-level entity (replaces Category + WordSet)
  nameHr, nameRu, nameUk, nameEn
  sortOrder, isActive
  rulesHtml (Text, nullable) <- rich-text HTML rules for the exercise topic
  createdAt, updatedAt

ExerciseTopicType            <- which exercise types are enabled for a topic
  topicId + exerciseType @unique (@@unique)
  cascade delete from ExerciseTopic

TypeTheAnswerItem            <- items for "Type the Answer" exercise
  topicId
  baseForm, answer
  translationRu, translationUk, translationEn
  sortOrder

FlashcardItem                <- items for flashcard exercise
  topicId
  frontText
  translationRu, translationUk, translationEn
  sortOrder

FillInBlankItem              <- items for fill-in-the-blank exercise
  topicId
  sentenceHr                 <- sentence with {{BLANK}} placeholder
  blankAnswer
  translationRu, translationUk, translationEn
  sortOrder

UserExerciseProgress
  userId + exerciseType + itemId @unique
  topicId                    <- for filtering by topic
  itemId (String)            <- generic ID, no FK (polymorphic across item tables)
  seenInCurrentCycle (Boolean)
  cycleNumber
  totalAttempts, correctAttempts
  lastSeenAt, lastCorrectAt

ExerciseSession
  userId, exerciseType, topicId
  status (IN_PROGRESS|COMPLETED|ABANDONED)
  totalQuestions, correctAnswers, xpEarned
  createdAt, completedAt

SessionAnswer
  sessionId, itemId (String, no FK), givenAnswer, isCorrect

StreakLog
  userId + date @unique   <- one record per day
  xpEarned

Admin
  id, email, passwordHash
  createdAt, updatedAt

DictionaryCollection
  id, name, description (nullable)
  createdByAdminId (nullable), createdByUserId (nullable)
  isPublic (Boolean, default false) <- true = admin-created, visible to all
  sortOrder, createdAt, updatedAt

PredefinedDictionaryWord          <- admin-defined template words for a collection
  id, collectionId (FK to DictionaryCollection, onDelete: Cascade)
  wordHr, translationRu, translationUk, translationEn
  sortOrder
  @@unique([collectionId, wordHr])

UserDictionaryWord
  userId, wordHr, translation
  translationLanguage (RU|UK|EN)   <- derived from user's nativeLanguage on write
  collectionId (nullable FK to DictionaryCollection, onDelete: SetNull)
  @@unique([userId, wordHr])
  @@index([wordHr, translationLanguage]) <- for shared translation pool queries

DictionaryWordProgress
  userId, wordId (unique FK to UserDictionaryWord, onDelete: Cascade)
  totalAttempts, correctAttempts
  lastPracticedAt
  @@unique([userId, wordId])

DictionaryPracticeSession
  userId, status (IN_PROGRESS|COMPLETED|ABANDONED)
  totalQuestions, correctAnswers, xpEarned
  createdAt, completedAt

DictionaryPracticeAnswer
  sessionId, wordId, givenAnswer, isCorrect

DictionaryWordReview            <- FSRS-6 spaced-repetition card, seeded when a word becomes fully learned
  userId, wordId (unique FK to UserDictionaryWord, onDelete: Cascade)
  due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses
  state (FsrsCardState: NEW|LEARNING|REVIEW|RELEARNING)
  lastReview (nullable)
  @@unique([userId, wordId]) <- via unique wordId
  @@index([userId, due])    <- for fetching due cards

DictionaryReviewSession
  userId, status (IN_PROGRESS|COMPLETED|ABANDONED)
  totalQuestions, correctAnswers, xpEarned
  createdAt, completedAt

DictionaryReviewAnswer
  sessionId, wordId, rating (1=Again 2=Hard 3=Good 4=Easy)

Lesson
  id, title, description (nullable), sortOrder, isActive
  createdAt, updatedAt

LessonItem
  id, lessonId (FK to Lesson, onDelete: Cascade)
  itemType (EXERCISE_TOPIC | DICTIONARY_COLLECTION)
  itemId (String, no FK — polymorphic)
  sortOrder
```

---

## NestJS Modules

| Module                | Responsibility                                                 |
| --------------------- | -------------------------------------------------------------- |
| `AuthModule`          | Google OAuth2 + Apple, email/password (admins), JWT (access 15m + refresh 30d in Redis) |
| `UsersModule`         | profile, language, push token, account deletion (GDPR)         |
| `ContentModule`       | CRUD for topics + per-type exercise items (write — admin only) |
| `ExercisesModule`     | sessions, results processing                                   |
| `ProgressModule`      | `UserExerciseProgress`, item cycle logic                       |
| `SubscriptionsModule` | subscription status, plan list with currency                   |
| `PaymentsModule`      | Stripe Checkout, Customer Portal, webhook                      |
| `RevenueCatModule`    | RevenueCat webhook (HMAC verification)                         |
| `GamificationModule`  | XP, streak, StreakLog                                          |
| `NotificationsModule` | BullMQ producer/consumer for Expo push                         |
| `AnalyticsModule`     | aggregations for admin (registrations, subscriptions)          |
| `AdminModule`         | `AdminGuard` + admin-only endpoints, admin user management (add new admins) |
| `DictionaryModule`    | personal dictionary CRUD, collections (user + admin), predefined word sets, bulk add-set, shared translation suggestions, practice sessions (Type the Answer) |
| `LessonsModule`       | admin CRUD for lessons + lesson items (topics/collections); public read for active lessons |

---

## Key API Endpoints

### Auth

```
POST /auth/google
POST /auth/apple
POST /auth/refresh
POST /auth/logout
```

### Admin Auth

```
POST /admin/auth/login
POST /admin/auth/refresh
POST /admin/auth/logout
```

### Users

```
GET    /users/me
PATCH  /users/me
POST   /users/me/push-token
DELETE /users/me
```

### Content (public read)

```
GET /content/topics                          # list active topics with exercise types
GET /content/topics/:id                      # single topic with exercise types
GET /content/topics/:topicId/items/:exerciseType  # items for a specific exercise type
```

### Exercises (protected by SubscriptionGuard)

```
POST /exercises/sessions              # create session, get items + correct answers
POST /exercises/sessions/:id/finish  # submit results, award XP
GET  /exercises/sessions/:id         # get session data (includes correct answers)
```

**Session resume strategy**: If the app closes mid-session, the session is restarted from scratch. No partial progress is persisted server-side. The `GET /exercises/sessions/:id` endpoint returns session metadata and correct answers, but not prior user responses. Abandoned sessions (status = `IN_PROGRESS` with no activity) can be cleaned up via a scheduled job.

### Subscriptions & Payments

```
GET  /subscriptions/plans            # prices in currency by IP
GET  /subscriptions/me
POST /payments/stripe/checkout
POST /payments/stripe/portal
POST /payments/stripe/webhook        # raw body, no auth guard
POST /revenuecat/webhook             # HMAC verification
```

### Admin (protected by AdminGuard)

```
POST /admin/admins                    # add new admin
GET  /admin/admins                    # list all admins
POST/PATCH/DELETE /admin/topics
PATCH /admin/topics/:id/exercise-types
POST/PATCH/DELETE /admin/type-the-answer-items
POST/PATCH/DELETE /admin/flashcard-items
POST/PATCH/DELETE /admin/fill-in-blank-items
GET  /admin/topics/:topicId/{type}-items  # list items by topic
POST/PATCH        /admin/subscription-plans
GET  /admin/users
PATCH /admin/users/:id/block
GET  /admin/analytics/overview
POST/PATCH/DELETE /admin/dictionary-collections  # manage predefined collections
GET  /admin/dictionary-collections
GET  /admin/dictionary-collections/:id/words     # list predefined words in collection
POST /admin/dictionary-collections/:id/words     # add predefined word to collection
PATCH  /admin/dictionary-collections/words/:wordId  # update predefined word
DELETE /admin/dictionary-collections/words/:wordId  # delete predefined word
```

### Lessons (admin endpoints protected by AdminGuard; public endpoint by BetterAuthGuard)

```
GET    /admin/lessons                       # list all lessons (incl. inactive)
POST   /admin/lessons                       # create lesson { title, description?, sortOrder?, isActive? }
PATCH  /admin/lessons/:id                   # update lesson (partial)
DELETE /admin/lessons/:id                   # delete lesson (cascades to items)
POST   /admin/lessons/:id/items             # add item { itemType: EXERCISE_TOPIC|DICTIONARY_COLLECTION, itemId, sortOrder? }
DELETE /admin/lessons/:id/items/:itemId     # remove item from lesson

GET    /lessons                             # list active lessons with resolved item names (student-facing)
```

Lesson items use a polymorphic `itemId` (no FK) referencing either `ExerciseTopic.id` or `DictionaryCollection.id`. Item names are resolved server-side in a batched `Promise.all` query (no N+1).

### Dictionary (protected by JwtAuthGuard)

```
GET    /dictionary/words                    # paginated (cursor-based), supports ?search, ?collectionId
POST   /dictionary/words                    # add word (translation + optional collectionId)
DELETE /dictionary/words/:id                # remove word
PATCH  /dictionary/words/:id/collection     # assign/unassign collection
PATCH  /dictionary/words/batch              # batch assign to collection { wordIds, collectionId }
GET    /dictionary/suggestions?word=X       # shared translation pool (filtered by user's nativeLanguage)
GET    /dictionary/collections              # predefined + personal collections
POST   /dictionary/collections              # create personal collection
PATCH  /dictionary/collections/:id          # update personal collection
DELETE /dictionary/collections/:id          # delete personal collection
POST   /dictionary/collections/:id/add-set  # bulk-add predefined words to user's dictionary
POST   /dictionary/practice/sessions        # start practice session
POST   /dictionary/practice/sessions/:id/finish  # submit results, award XP
GET    /dictionary/review/due-count         # count of words due for FSRS revision
POST   /dictionary/review/sessions          # start an FSRS revision session
POST   /dictionary/review/sessions/:id/finish  # apply ratings, reschedule cards, award XP
```

### Dictionary — Design Notes

- **Cursor-based pagination** for word list (not offset) — handles inserts/deletes during scrolling without skipping/duplicating items
- **No Redis cache** for dictionary data — per-user, write-heavy; TanStack Query handles frontend caching
- **`translationLanguage`** is derived server-side from `user.nativeLanguage`, not sent by client — prevents shared pool corruption
- **Shared translation pool**: `groupBy` query on `UserDictionaryWord` where `wordHr` matches and `translationLanguage` = user's language, ordered by popularity (count desc), top 5 suggestions
- **Practice sessions** use separate models from `ExerciseSession` (not tied to ExerciseTopic/ExerciseType)
- **Progress %** = `correctAttempts / totalAttempts * 100`, computed on the fly (not stored)
- **Collection deletion** sets words' `collectionId` to null — words are preserved, not deleted
- **FSRS revision** (`DictionaryReviewService`, using `ts-fsrs`): a word is seeded into the review pool the moment it becomes fully learned (all 4 drill percents at 100). Scheduler uses `generatorParameters({ request_retention: 0.9, enable_short_term: false })` — day-granularity only, no minute-level learning steps. `startSession` previews all 4 rating outcomes per due card via `scheduler.repeat()`; `finishSession` applies the chosen rating via `scheduler.next()` and persists the updated card. `Hard`/`Good`/`Easy` count as correct for XP/streak purposes, `Again` counts as incorrect. With `enable_short_term: false`, `FsrsCardState.LEARNING`/`RELEARNING` are never actually reached — every rating keeps the card in `REVIEW` (or `NEW` before its first review); a lapse only increments `lapses` and shortens the next interval (verified against the real scheduler).

---

## Item Cycle Logic

```
getNextItems(userId, exerciseType, topicId, count):

1. Find items with seenInCurrentCycle = false in UserExerciseProgress
2. If enough -> fetch actual items from type-specific table, return them
3. If items are exhausted -> offer user to reset:
     UPDATE UserExerciseProgress
     SET seenInCurrentCycle = false,
         cycleNumber = cycleNumber + 1
     WHERE userId AND exerciseType AND topicId
4. If user agrees, return first N items from the reset cycle

On session finish -> bulk markItemsSeen() -> seenInCurrentCycle = true for all answered items
```

**New users**: On first session for a topic+exerciseType — create `UserExerciseProgress` records for all items with `seenInCurrentCycle = false`. Uses two-query pattern: progress table for unseen itemIds, then fetch items from the correct type-specific table.

**Note**: `itemId` in `UserExerciseProgress` is a generic string (no FK) since items live in different tables per exercise type. Validation happens at the application layer.

---

## Prisma Commands

```bash
npx prisma format --schema=src/prisma/schema.prisma
npx prisma validate --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --schema=src/prisma/schema.prisma
npx prisma studio --schema=src/prisma/schema.prisma
```

Or from monorepo root:

```bash
npm run -w cro-api prisma:migrate
npm run -w cro-api prisma:generate
npm run -w cro-api seed
```

### Migration Safety Rules

Always use the `/migrate` command — it enforces the two-phase (generate SQL → review → apply) workflow and contains all safety rules and destructive-pattern detection. Never run `prisma migrate reset`, `prisma db push`, or raw `DROP TABLE`/`TRUNCATE` directly.

---

## Critical Files

- `src/prisma/schema.prisma` — full data schema; migrate before any module development
- `src/modules/content/content.service.ts` — topics + per-type item CRUD
- `src/modules/progress/progress.service.ts` — item cycle logic; most critical business logic
- `src/modules/payments/payments.service.ts` — webhook + idempotency; bugs = financial losses
- `src/modules/dictionary/dictionary.service.ts` — dictionary word CRUD, shared translation pool, cursor pagination
- `src/modules/dictionary/dictionary-practice.service.ts` — dictionary practice sessions, progress tracking

**Doc maintenance**: See `.claude/skills/api-doc-maintenance/SKILL.md` — auto-loads when editing `src/modules/dictionary/` or `src/modules/exercises/` files and prompts to update `docs/exercises.md` when API shape or behavior changes.
