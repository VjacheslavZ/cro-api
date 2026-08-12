# @cro/shared — Shared Types, Constants, Utilities

Workspace package consumed by all apps (`cro-api`, `cro-web`, `cro-admin`, `cro-mobile`). Exports shared TypeScript types (including the `ExerciseItem` discriminated union), constants, and utility functions.

Key file: `src/types/index.ts`

---

## Exercise Types (MVP)

| Type                  | Mechanics                                                                     | Validation                                                                 |
| --------------------- |-------------------------------------------------------------------------------| -------------------------------------------------------------------------- |
| **Type the Answer** | `baseForm` is shown -> user enters the ansver (TypeTheAnswerItem)             | trim + lowercase + NFC normalization, client-side comparison with `answer` |
| **Flashcards**        | `frontText` shown -> tap "I knew it" / "I didn't know" (FlashcardItem)        | `KNOWN` -> isCorrect=true; `UNKNOWN` -> isCorrect=false |
| **Fill-in-the-blank** | `sentenceHr` with `{{BLANK}}` placeholder (FillInBlankItem)                   | Client-side comparison with `blankAnswer` |
| **Dictionary Practice** | Croatian word (`wordHr`) shown -> user types translation (UserDictionaryWord) | trim + lowercase + NFC normalization, client-side comparison with `translation` |
| **Revision (FSRS)** | Croatian word shown -> tap to reveal translation -> self-report recall via Again/Hard/Good/Easy (DictionaryWordReview) | FSRS-6 scheduler (`ts-fsrs`) computes next `due` date, `stability`, `difficulty` per rating |

### Exercise Rules

Each `ExerciseTopic` can have optional rich-text rules (`rulesHtml` field, nullable HTML string). Rules describe grammar rules relevant to the exercise and are authored via a Tiptap rich text editor in the admin panel.

During an exercise session, if the topic has rules, a **"Show Rules"** button appears next to the progress indicator. Clicking it opens a non-blocking dialog displaying the formatted rules. The session continues uninterrupted.

- **Admin**: Rules are edited in the topic create/edit form via the `RichTextEditor` component (Tiptap)
- **API**: `rulesHtml` is included in the `createSession` response alongside session items
- **Web**: `ExerciseRulesDialog` component renders the HTML in a MUI Dialog
- **Storage**: HTML string in PostgreSQL `TEXT` column, flows through Redis cache with topic data

---

## Dictionary

### Overview

Every user has a personal dictionary page at `/dictionary/my`, accessible via the Dictionary button in the header. Users manually add Croatian words with translations in their native language. A shared translation pool suggests translations from other users (same language) when adding a word.

### Add Word Flow

1. User types a Croatian word in the search input, clicks "Add"
2. Modal opens with the word pre-filled
3. `GET /dictionary/suggestions?word=X` fires — returns existing translations from the shared pool (filtered by user's `nativeLanguage`)
4. If suggestions exist, show them as clickable chips
5. User picks a suggestion or types a custom translation
6. Optional: select a collection from dropdown
7. Submit creates the word via `POST /dictionary/words`

### Collections

- Two sections: "Predefined Collections" (admin-created, `isPublic: true`) and "My Collections" (user-created)
- "Create Collection" button opens modal with name + description fields
- Clicking a collection navigates to `/dictionary/my?collectionId=xxx` (filtered view)
- Personal collections can be edited/deleted; predefined collections are read-only for users

### Dictionary Practice

- Uses "Type the Answer" mechanic: show Croatian word (`wordHr`) → user types translation
- `POST /dictionary/practice/sessions` creates a session, prioritizing words with lowest progress or never-practiced
- `POST /dictionary/practice/sessions/:id/finish` submits results, updates `DictionaryWordProgress`, awards XP via `GamificationModule`
- Reuses existing `TextInputExercise` component on web

### Dictionary Revision (FSRS-6)

Long-term retention for words the user has already learned, using the FSRS-6 spaced-repetition algorithm via the `ts-fsrs` package.

- **Seeding**: the moment a word's `isLearned` flips true (all 4 drill percents on `DictionaryWordProgress` reach 100%, via `DictionaryPracticeService.finishSession`'s Learn Words branch, or via the manual `PATCH /dictionary/words/:id/learned` shortcut), `DictionaryReviewService.seedIfLearned` creates a `DictionaryWordReview` card (`createEmptyCard()`, state `NEW`, due immediately). No separate opt-in action.
- **Scheduler config**: `generatorParameters({ request_retention: 0.9, enable_short_term: false })` — short-term (minute-level) learning steps are disabled, so every interval is computed in whole days. This fits a session-based web app with no push-notification loop back into the same session.
- **Card state**: `DictionaryWordReview` stores `due`, `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `state` (`FsrsCardState`: NEW/LEARNING/REVIEW/RELEARNING), `lastReview` — one row per `UserDictionaryWord` (1:1). With `enable_short_term: false`, only `NEW` and `REVIEW` are ever actually reached — every rating (including "Again") keeps the card in `REVIEW`, only `lapses` increments and the interval shortens. `LEARNING`/`RELEARNING` exist in the enum but are unreachable under this config.
- **Session flow**: `POST /dictionary/review/sessions` fetches due cards (`due <= now`, ordered by `due` asc) and returns each with a preview of all 4 rating outcomes (`scheduler.repeat(card, now)`) as `intervals: { again, hard, good, easy }` (day counts, formatted client-side for i18n). `POST /dictionary/review/sessions/:id/finish` applies each rating via `scheduler.next(card, now, rating)` and persists the updated card.
- **XP/streak**: `Hard`/`Good`/`Easy` count as correct, `Again` counts as incorrect — feeds `GamificationService.awardXpAndUpdateStreak` unchanged.
- **Due count badge**: `GET /dictionary/review/due-count` powers the "Revision" entry point badge on the web Vocabulary page; the card is hidden entirely when the count is 0.
- Not implemented (deliberately out of scope for MVP): example sentences on the review card, a per-review audit log for future FSRS parameter optimization, push/reminder notifications for due cards, admin-configurable FSRS parameters.

---

## Lessons

Lessons are structured learning paths composed of existing content.

| Type | Interface | Description |
|------|-----------|-------------|
| `Lesson` | `{ id, title, description, sortOrder, isActive, items, createdAt }` | Top-level lesson entity |
| `LessonItem` | `{ id, lessonId, itemType, itemId, itemName, sortOrder }` | Item reference within a lesson |
| `LessonItemType` | `EXERCISE_TOPIC \| DICTIONARY_COLLECTION` | Enum distinguishing item kinds |

`itemName` is resolved server-side: `ExerciseTopic.nameEn` for topics, `DictionaryCollection.nameEn` for collections.

---

## Payment Architecture

### Currency Detection

`CurrencyMiddleware` -> `geoip-lite.lookup(req.ip)` -> EU countries = EUR, others = USD -> attached to request context.

### Stripe (Web)

```
Click "Subscribe" ->
POST /payments/stripe/checkout { planId } ->
stripe.checkout.sessions.create(...) ->
redirect to Stripe Checkout ->
webhook: checkout.session.completed -> update Subscription in DB
```

Webhook security: `stripe.webhooks.constructEvent(rawBody, sig, secret)`. Idempotency: check `WebhookEvent.externalEventId` before processing.

### RevenueCat (Mobile)

```
Purchases.configure({ apiKey, appUserID: userId }) ->
Purchases.purchasePackage(package) ->
App Store / Google Play IAP ->
RevenueCat webhook -> POST /revenuecat/webhook ->
update Subscription in DB
```

Webhook security: HMAC from `Authorization` header (shared secret from RevenueCat dashboard).

### Trial

- Automatically activated on first login (server creates trial during auth — no separate endpoint)
- `status=TRIALING`, `trialEndsAt = now + 7 days`
- BullMQ schedules push notifications: 48h and 2h before expiry
- `SubscriptionGuard` checks `status IN [TRIALING, ACTIVE] AND period_end > now`

---

## Gamification

- **XP**: 10 XP per correct answer (constant in config)
- **Streak**: +1 day if `lastPracticeDate` = yesterday; reset to 0 if a day is missed
- `StreakLog` — one record per day (`@@unique([userId, date])`)
- Display: web header + mobile tab bar
