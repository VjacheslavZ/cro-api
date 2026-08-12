# Exercises Documentation

## Exercise Component Conventions

Each exercise type lives in a self-contained folder under `apps/web/src/features/exercises/`.

| Component | Callback | When it fires |
|-----------|----------|---------------|
| `LetterPickExercise` | `onAnswer(answer)` | Once, on "Next" button click after the word is fully assembled |
| `TextInputExercise` | `onAnswer(answer)` | Once, after the user submits and sees the result |
| `MatchingExercise` | `onComplete(answers[])` | Once, when all word–translation pairs are matched |
| `BuildSentenceExercise` | `onAnswer(answer)` | Once, only on correct assembly (auto-fires after 1.5 s); incorrect resets to retry — `onAnswer` is never called with `isCorrect: false` |
| `DictionaryReviewExercise` | `onAnswer({ wordId, rating })` | Once per card, after the user taps to reveal the translation and picks one of 4 rating buttons (Again/Hard/Good/Easy). Does **not** use the `itemId`/`givenAnswer`/`isCorrect` shape — emits the raw FSRS `rating` directly since the caller needs it for the finish-session request, not just a boolean. `revealed` state is controlled by the parent (`DictionaryReviewPage`) so it can reset between cards. |

### Critical gotcha — `dispatch(fetchMe())` unmounts the session page

`fetchMe` sets `auth.loading = true` in the Redux auth slice. `AuthGuard` (in `AppRouter.tsx`) renders a full-screen `<CircularProgress />` when `loading = true`, which **unmounts all children** including any active exercise page. This destroys all exercise state and re-triggers the mount `useEffect`.

**Rule**: Never call `dispatch(fetchMe())` between exercise steps. Only call it on the **final step**, immediately before `navigate()` to the results page — at that point the component is about to unmount anyway.

---

## Learn Words Feature

### Overview

"Learn Words" is a structured vocabulary learning mode that guides users through all 4 exercise types for a selected set of words. A word is considered **learned** when each of the 4 exercise types reaches 100% progress.

### User Flow

```
Vocabulary Page
  └─ "Learn Words" card (highlighted)
       └─ /exercises/vocabulary/learn  (Setup)
            ├─ Select word count: 5 / 10 / 15 / 20
            ├─ Select filter: Newest / Oldest / By Progress (0%→100%)
            └─ Next
                 └─ /exercises/vocabulary/learn/preview  (Preview)
                      ├─ Shows selected words one by one (Croatian word + Translation)
                      └─ "Start Exercises"
                           └─ /exercises/vocabulary/learn/session  (Session)
                                ├─ Step 1 — Build the Word      (letter-pick)
                                ├─ Step 2 — Word → Translation  (word-to-translate)
                                ├─ Step 3 — Translation → Word  (translate-to-word)
                                └─ Step 4 — Listening Match     (matching)
                                     └─ /exercises/vocabulary/learn/results
```

### Progress Model

Each word tracks 4 independent progress values (0–100%), one per exercise type:

| Field | Exercise Type |
|-------|---------------|
| `wordToTranslatePercent` | Word → Translation |
| `translateToWordPercent` | Translation → Word |
| `letterPickPercent` | Build the Word |
| `matchingPercent` | Listening Match |

**Rules:**
- Correct answer: `+25%` (clamped to 100)
- First mistake in a session: `−25%` (clamped to 0)
- `progressPercent` in My Dictionary = average of all 4 types
- `isLearned = true` when all 4 types are at 100%

### Database Schema

`DictionaryWordProgress` model (migration: `20260408210947_add_per_type_progress`):

```prisma
wordToTranslatePercent  Int @default(0)
translateToWordPercent  Int @default(0)
letterPickPercent       Int @default(0)
matchingPercent         Int @default(0)
```

### API

**`POST /dictionary/practice/sessions`** — extended request:
```json
{
  "wordIds": ["uuid1", "uuid2"],
  "exerciseType": "letter-pick",
  "filter": "newest"
}
```
- `wordIds` — pin exact words across all 4 steps
- `exerciseType` — which per-type progress column to update on finish
- `filter` — `newest` | `oldest` | `progress`

**`POST /dictionary/practice/sessions/:id/finish`** — extended request:
```json
{ "answers": [...], "exerciseType": "letter-pick" }
```
Updates that type's progress column (+25/−25 per answer). Without `exerciseType`, falls back to legacy `totalAttempts`/`correctAttempts` behavior.

**`GET /dictionary/words`** — new `sort` param (`newest` | `oldest` | `progress`). Response now includes per-type progress fields and `isLearned`.

### Frontend Components

| File | Description |
|------|-------------|
| `LearnWords/LearnWordsSetupPage.tsx` | Word count + filter selection |
| `LearnWords/LearnWordsPreviewPage.tsx` | One-word-at-a-time preview before exercises |
| `LearnWords/LearnWordsSessionPage.tsx` | Orchestrates 4 sequential exercises |
| `LearnWords/LearnWordsResultsPage.tsx` | Aggregate results after all 4 steps |

---

## Build Sentence Exercise

### Overview

`BUILD_SENTENCE` is a word-ordering exercise where the user taps words one at a time to construct the Croatian translation of a sentence shown in their native language.

### Component files

| File | Responsibility |
|------|----------------|
| `BuildSentenceExercise/BuildSentenceExercise.tsx` | Phase state machine, handlers, card wrapper |
| `BuildSentenceExercise/WordProgressRow.tsx` | Built-so-far chips row (blue during selecting; last chip has × undo button; green/red-strikethrough after) |
| `BuildSentenceExercise/WordOptions.tsx` | Current-slot word counter + 6 option buttons in a 3-column grid; keyboard shortcuts 1–6 with numbered badge on each button |
| `BuildSentenceExercise/ResultBanner.tsx` | Correct (green) or incorrect (red + correct sentence + Next) banners |

### Phase state machine

| Phase | Trigger | UI |
|-------|---------|-----|
| `selecting` | Initial | 3-column grid of option buttons (keys 1–6); built-so-far chips blue; last chip has × undo button |
| `correct` | All words chosen, all correct | Green alert; auto-advance after 1500 ms; `speak(correctSentence)` fires |
| `incorrect` | All words chosen, ≥1 wrong | Red alert with correct sentence; **Try Again** button resets state to `selecting`; `speak(correctSentence)` fires; `onAnswer` is never called — user must retry until correct |

### Options generation (server-side, `ContentService.getBuildSentenceItemsWithOptions`)

For each word slot, the server builds a pool of 6 options: the correct `wordHr` + admin-configured distractors. If fewer than 5 distractors are configured, the pool is padded with other `wordHr` values from the same session batch. Options are Fisher-Yates shuffled before being sent in the session response.

### Data shape

```ts
interface BuildSentenceWordOption {
  id: string;
  wordHr: string;
  position: number;   // 0-based slot index
  options: string[];  // 6 shuffled choices (correct + distractors)
}
interface BuildSentenceItem {
  id: string;
  topicId: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
  words: BuildSentenceWordOption[];
}
```

---

### Collection Support

If the user accesses Vocabulary from a filtered dictionary view (`?collectionId=xxx`), the Learn Words flow passes that `collectionId` through to the preview and session, restricting words to that collection.

### My Dictionary Changes

- `progressPercent` is now the average of 4 per-type values (was `correctAttempts/totalAttempts`)
- Words with `isLearned=true` show a green "Learned" chip instead of the progress bar

---

## Dictionary Revision (FSRS) Exercise

### Overview

Long-term retention exercise for words the user has already learned, using the FSRS-6 spaced-repetition algorithm (`ts-fsrs` npm package). A word enters the review pool automatically the moment it becomes fully learned (all 4 Learn Words percents at 100%) — there is no separate opt-in step.

### User Flow

```
Vocabulary Page
  └─ "Revision" card (shown only when due count > 0, with a due-count badge)
       └─ POST /dictionary/review/sessions
            └─ /dictionary/review/:sessionId  (Session)
                 ├─ Shows Croatian word, tap to reveal translation
                 ├─ 4 rating buttons: Again / Hard / Good / Easy, each labeled with
                 │  the predicted next-review interval (day count, formatted client-side)
                 └─ POST /dictionary/review/sessions/:id/finish (on last item)
                      └─ /dictionary/review/results/:sessionId
```

### Scheduling model

- Scheduler: `fsrs(generatorParameters({ request_retention: 0.9, enable_short_term: false }))` — short-term (minute-level) learning steps are disabled, so ts-fsrs uses its `LongTermScheduler`. In practice this means a card only ever reaches `NEW` (before its first review) or `REVIEW` (after) — **every** rating, including "Again", sets `state = REVIEW`; a lapse only increments `lapses` and shortens the next interval. `LEARNING`/`RELEARNING` in `FsrsCardState` are kept for schema completeness but are never actually reached with this configuration (verified against the real scheduler, not just the docs).
- `DictionaryReviewService.seedIfLearned(userId, wordId)` creates the initial card (`createEmptyCard()`) the first time a word's 4 drill percents are all 100 — called from both `DictionaryPracticeService.finishSession` (Learn Words branch) and `DictionaryService.markWordAsLearned` (manual shortcut).
- `startSession` fetches cards where `due <= now`, ordered by `due` ascending, and previews all 4 rating outcomes per card via `scheduler.repeat(card, now)`.
- `finishSession` applies the chosen rating via `scheduler.next(card, now, rating)` and persists the resulting `due`/`stability`/`difficulty`/`elapsedDays`/`scheduledDays`/`reps`/`lapses`/`state`/`lastReview` onto `DictionaryWordReview`.
- XP/streak: `Hard`/`Good`/`Easy` count as a correct answer, `Again` counts as incorrect, fed into the existing `GamificationService.awardXpAndUpdateStreak` unchanged.

### Database Schema

Migration: `20260726000000_add_dictionary_word_review`.

```prisma
enum FsrsCardState { NEW LEARNING REVIEW RELEARNING }

model DictionaryWordReview {
  userId, wordId (unique FK to UserDictionaryWord, onDelete: Cascade)
  due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses
  state FsrsCardState @default(NEW)
  lastReview DateTime?
  @@index([userId, due])
}

model DictionaryReviewSession {
  userId, status, totalQuestions, correctAnswers, xpEarned, createdAt, completedAt
}

model DictionaryReviewAnswer {
  sessionId, wordId, rating  // 1=Again 2=Hard 3=Good 4=Easy
}
```

### API

```
GET  /dictionary/review/due-count               # { dueCount }
POST /dictionary/review/sessions                # { count? } -> { sessionId, items, totalQuestions }
POST /dictionary/review/sessions/:id/finish     # { answers: [{ wordId, rating }] } -> same shape as FinishDictionaryPracticeResponse
```

Each `items[]` entry is `{ wordId, wordHr, translation, intervals: { again, hard, good, easy } }` — `intervals` are **day counts**, not pre-formatted strings; the frontend formats them with i18next pluralization (`dictionary.review.intervalDay_one/_few/_many/_other`) so the interval text is correctly localized in ru/uk/en.

### Frontend Components

| File | Description |
|------|-------------|
| `exercises/DictionaryReviewExercise/DictionaryReviewExercise.tsx` | Tap-to-reveal card + 4-tier rating buttons with interval labels |
| `dictionary/Review/DictionaryReviewPage.tsx` | Session orchestrator (route `/dictionary/review/:sessionId`) |
| `dictionary/Review/DictionaryReviewResultsPage.tsx` | Results screen (route `/dictionary/review/results/:sessionId`) |

Entry point: a "Revision" card on `VocabularyPage.tsx`, shown only when `useDictionaryReviewDueCount()` is greater than 0.

### Deliberately out of scope (MVP)

- Example sentences on the review card
- A per-review audit log (for future FSRS parameter optimization)
- Push/reminder notifications for due cards
- Admin-configurable FSRS parameters (request retention, etc.)
