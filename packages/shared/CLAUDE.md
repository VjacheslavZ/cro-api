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
