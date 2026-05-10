# Exercises Documentation

## Exercise Component Conventions

Each exercise type lives in a self-contained folder under `apps/web/src/features/exercises/`.

| Component | Callback | When it fires |
|-----------|----------|---------------|
| `LetterPickExercise` | `onAnswer(answer)` | Once, on "Next" button click after the word is fully assembled |
| `TextInputExercise` | `onAnswer(answer)` | Once, after the user submits and sees the result |
| `MatchingExercise` | `onComplete(answers[])` | Once, when all word–translation pairs are matched |
| `BuildSentenceExercise` | `onAnswer(answer)` | Once, when the sentence is fully assembled: auto-fires after 1.5 s on correct; fires on user pressing Next on incorrect |

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
| `incorrect` | All words chosen, ≥1 wrong | Red alert with correct sentence; Next/Finish button; `speak(correctSentence)` fires |

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
