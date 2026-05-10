# CroGrammar — Web App Design Document

> **For**: Freelance UX/UI Designer  
> **Scope**: Student web app only (`apps/web`) — the interface used by learners  
> **Admin panel** is out of scope for this document  
> **Status**: Current implementation as of Phase 2 (Content + Exercise Engine)  
> **Last updated**: 2026-04-24 (updated 3.8 Vocabulary Hub — corrected layout to vertical list, card interaction model, collectionId scope)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [App-Wide Patterns](#2-app-wide-patterns)
3. [Screens](#3-screens)
   - [3.1 Login](#31-login-login)
   - [3.2 Language Selection](#32-language-selection-language-select)
   - [3.3 Home](#33-home-)
   - [3.4 Grammar Topics List](#34-grammar-topics-list-exercisesgrammar)
   - [3.5 Topic Exercise Selector](#35-topic-exercise-selector-exercisestopicid)
   - [3.6 Exercise Session](#36-exercise-session-exercisessessionsessionid)
   - [3.7 Grammar Session Results](#37-grammar-session-results-exercisesresultssessionid)
   - [3.8 Vocabulary Hub](#38-vocabulary-hub-exercisesvocabulary)
   - [3.9 Learn Words Setup](#39-learn-words-setup-exercisesvocabularylearn)
   - [3.10 Learn Words Preview](#310-learn-words-preview-exercisesvocabularylearnpreview)
   - [3.11 Learn Words Session](#311-learn-words-session-exercisesvocabularylearnsession)
   - [3.12 Learn Words Results](#312-learn-words-results-exercisesvocabularyLearnresults)
   - [3.12a Speed Quiz Session](#312a-speed-quiz-session-exercisesvocabularyspeed-quiz)
   - [3.13 Dictionary Practice Session](#313-dictionary-practice-session-dictionarypracticesessionid)
   - [3.14 Dictionary Practice Results](#314-dictionary-practice-results-dictionarypracticeresultssessionid)
   - [3.15 My Dictionary](#315-my-dictionary-dictionarymy)
   - [3.16 My Collections](#316-my-collections-dictionarymy-collections)
   - [3.17 Recommended Word Sets](#317-recommended-word-sets-dictionaryrecommended-word-sets)
   - [3.18 Collection Preview](#318-collection-preview-dictionarycollectionscollectionid)
   - [3.19 Settings](#319-settings-settings)
4. [Exercise UI Components](#4-exercise-ui-components)
   - [4.1 Type the Answer](#41-type-the-answer)
   - [4.2 Flashcard](#42-flashcard)
   - [4.3 Fill in the Blank](#43-fill-in-the-blank)
   - [4.4 Letter Pick](#44-letter-pick)
   - [4.5 Matching](#45-matching)
   - [4.6 Build a Sentence](#46-build-a-sentence)
5. [Shared Dialogs](#5-shared-dialogs)
6. [Navigation Map](#6-navigation-map)
7. [Gamification System](#7-gamification-system)
8. [Internationalization](#8-internationalization)
9. [Design Notes & Constraints](#9-design-notes--constraints)
10. [Mobile Design — FUTURE](#10-mobile-design--future)
    - [10.1 Responsive Web (Mobile Browser)](#101-responsive-web-mobile-browser)
    - [10.2 Native Mobile App (iOS & Android)](#102-native-mobile-app-ios--android)

---

## 1. Product Overview

**CroGrammar** is a web + mobile application for learning Croatian grammar and vocabulary. The primary audience is Russian, Ukrainian, and English speakers who want to learn Croatian through structured exercises and personal vocabulary building.

### Core Value Propositions

| Value | Description |
|-------|-------------|
| Grammar exercises | Structured exercises on grammar topics (nouns, verbs, declensions, etc.) |
| Vocabulary building | Personal word dictionary with spaced-repetition-style practice |
| Gamification | XP points and daily streak to motivate consistent practice |
| Adaptive language | The entire UI adapts to the learner's native language (RU / UK / EN) |

### Business Model

- 7-day free trial on signup (no payment required)
- Subscription-based access after trial (monthly/annual plan, managed via Stripe on web)
- Mobile version exists separately (iOS/Android) — this document covers web only

### User Journey at a Glance

```
Sign up (Google / email)
    → Select native language (one-time)
    → Practice grammar topics (3 exercise types per topic)
    → Build personal vocabulary (add words, organize into collections)
    → Practice vocabulary (5 practice modes, including guided "Learn Words" flow)
    → Track progress via XP and streak
```

---

## 2. App-Wide Patterns

These patterns apply across all authenticated screens.

### 2.1 Header

The top navigation bar is persistent on all authenticated pages.

**Left**: App logo / wordmark "CroGrammar" (links to home `/`)

**Center** (desktop) / hidden (mobile): Navigation menus
- **Exercises** dropdown: Grammar → `/exercises/grammar`, Vocabulary → `/exercises/vocabulary`
- **Dictionary** dropdown: My Dictionary → `/dictionary/my`, Collections → `/dictionary/my-collections`, Word Sets → `/dictionary/recommended-word-sets`

**Right**:
- XP chip: star icon + total XP number (e.g. "⭐ 340")
- Streak chip: fire icon + days count (e.g. "🔥 5")
- User menu (avatar or initials): Settings, Logout
- Language menu (for unauthenticated users): RU / UK / EN switcher

**States**:
- `loading`: Chips show skeleton loaders while user profile loads
- `unauthenticated`: Nav menus hidden; only logo and language selector shown

### 2.2 Footer

Shown on all pages. Dark background.

**Contents**:
- App name / branding
- Links: About Us, For Partners, Contacts
- Social icons: X (Twitter), YouTube, Facebook
- App store badges: Google Play, App Store (links to mobile app)
- Copyright: © {current year} CroGrammar

### 2.3 Loading States

| Scope | Pattern |
|-------|---------|
| App boot (auth check) | Full-screen centered spinner (blocks entire app until auth resolves) |
| Page data loading | Inline `CircularProgress` centered in page content area |
| Button action | Button shows spinner + disabled state while request is in flight |
| Infinite scroll | Spinner shown at bottom of list while next page loads |

### 2.4 Error States

- API errors are displayed as inline alert banners (red/error severity) near the relevant content
- Network errors show a generic "Something went wrong" alert
- 401 → automatic token refresh; if refresh fails → redirect to `/login`

### 2.5 Empty States

Each list/grid that can be empty must have an empty state:
- Friendly message explaining why it's empty
- Call-to-action button (e.g. "Add your first word" or "Browse Word Sets")

### 2.6 Confirmation Dialogs

Two recurring dialog patterns used throughout the app:

**Stop Exercise Dialog** (before abandoning any active exercise)
- Title: "Stop exercise?"
- Message: "Your progress in this session will be lost."
- Buttons: "Continue" (dismiss), "Stop" (destructive — abandon session and navigate away)

**Delete Confirmation Dialog** (before deleting a word or collection)
- Title: "Delete [item]?"
- Message: "This action cannot be undone."
- Buttons: "Cancel", "Delete" (destructive)

### 2.7 Snackbar Notifications

Short-lived toast notifications appear at the bottom of the screen for non-critical feedback:
- Success: e.g. "5 words added to your dictionary"
- Info: e.g. "Collection updated"

---

## 3. Screens

---

### 3.1 Login (`/login`)

**Purpose**: Entry point for unauthenticated users. Handles both registration and login.

**Route guard**: GuestRoute — redirects authenticated users to `/`

**Layout**:
- Centered card on a background (full viewport)
- App logo + name above the card
- Tagline / welcome text

**UI Elements**:

| Element | Details |
|---------|---------|
| App logo | Large, centered above card |
| Headline | "Welcome to CroGrammar" (or equivalent tagline) |
| Google OAuth button | "Sign in with Google" — full-width primary button with Google icon |
| Divider | "or" separator |
| Email/Password form | Collapsed by default; toggle link reveals it |
| Toggle link | "Don't have an account? Register" ↔ "Already have an account? Log in" |
| Submit button | "Log in" or "Register" depending on mode |
| Error alert | Shown below form on failure |

**Email/Password Form Fields**:
- Name (register mode only): text input
- Email: email input with validation
- Password: password input (masked, show/hide toggle)

**States**:

| State | Behavior |
|-------|---------|
| Default | Google button + toggle for email form |
| Email form open (login) | Shows email + password fields |
| Email form open (register) | Shows name + email + password fields |
| Loading | Submit/Google button disabled + spinner |
| Error | Red Alert message below form (e.g. "Invalid credentials", "Email already in use") |

**Post-Login Routing**:
- New user (no `nativeLanguage` set) → `/language-select`
- Returning user → `/` (home)

---

### 3.2 Language Selection (`/language-select`)

**Purpose**: One-time onboarding step after first login. Forces user to choose their native language before accessing the app.

**Route guard**: PrivateRoute only — cannot be accessed by guests; cannot be skipped (LanguageGuard enforces this on all protected routes)

**Layout**:
- Centered content, full-page
- App logo + headline above the buttons

**UI Elements**:

| Element | Details |
|---------|---------|
| Headline | "Choose your native language" |
| Subtitle | Explains this determines how translations are shown |
| Language buttons | 3 large equal-sized buttons: Russian, Ukrainian, English |
| Flag/icon per button | Each button has the country flag or language icon |

**Behavior**:
- Tapping a language button → saves preference to server (PATCH `/users/me`) → navigates to `/`
- No back button — this step is mandatory
- Loading state on each button while the PATCH request is in flight

---

### 3.3 Home (`/`)

**Purpose**: Main dashboard shown after login. Greets the user, displays key stats, and provides quick-access entry points to the two core practice flows.

**Layout**:
- Centered hero section at top
- Row of 4 stat cards
- Row of 3 action cards below

**Hero Section**:

```
┌────────────────────────────────────────────────┐
│          Welcome back to CroGrammar            │
│   Practice every day and reach your goals      │
└────────────────────────────────────────────────┘
```

Title and subtitle are i18n strings (`home.title`, `home.subtitle`).

**Stat Cards** (4 cards, responsive grid: 2×2 on mobile, 1×4 on desktop):

| Card | Icon | Value source |
|------|------|--------------|
| Grammar Topics | book icon | Total topics count from API |
| Words Learned | library icon | User's dictionary word count |
| Day Streak | flame icon | `user.currentStreak` |
| Total XP | star icon | `user.xpTotal` |

Each card: coloured circular icon background + large number + label below.

**Action Cards** (3 cards, responsive grid):

| Card | Button style | Destination |
|------|-------------|-------------|
| Practice Grammar | Primary (filled) | `/exercises/grammar` |
| Build Vocabulary | Secondary (outlined) | `/dictionary/my` |
| Browse Word Sets | Secondary (outlined) | `/dictionary/recommended-word-sets` |

Each card: title + one-line description + full-width button at bottom. Cards lift on hover.

**States**:

| State | Behavior |
|-------|---------|
| Loading | Stat values show `—` or `0` until API responds; no skeleton (data loads fast) |
| No topics yet | Grammar Topics stat shows `0`; action cards still usable |

---

### 3.4 Grammar Topics List (`/exercises/grammar`)

**Purpose**: Browse and select grammar topics to practice.

**Layout**:
- Page title + subtitle
- Grid of topic cards (responsive: 1 column mobile, 2-3 columns desktop)

**Topic Card**:

```
┌─────────────────────────────────┐
│  Topic Name (localized)         │
│                                 │
│  [TYPE THE ANSWER] [FLASHCARDS] │
└─────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Topic name | Localized (shown in user's native language) |
| Exercise type chips | Small chips for each enabled exercise type on this topic |
| Click area | Entire card is clickable → navigates to `/exercises/:topicId` |

**States**:
- Loading: Grid of skeleton cards
- Empty: "No topics available" message (unlikely in practice but must be handled)
- Error: Inline alert with retry button

---

### 3.5 Topic Exercise Selector (`/exercises/:topicId`)

**Purpose**: Choose which exercise type to practice for a specific grammar topic.

**Layout**:
- Back button → `/exercises/grammar`
- Topic name as page title
- List of exercise type cards (one per enabled type)

**Exercise Type Card**:

```
┌─────────────────────────────────┐
│  [Icon]  Type the Answer        │
│          Type the plural form   │
│                                 │
│                    [Start] →    │
└─────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Icon | Visual icon representing the exercise type |
| Type name | "Type the Answer", "Flashcards", "Fill in the Blank", "Build a Sentence" |
| Description | One-line description of what the exercise involves |
| Start button | Creates a session and navigates to `/exercises/session/:sessionId` |

**Cycle Reset Dialog**:

Shown when the user tries to start an exercise but has exhausted all items in the current cycle.

- Title: "All items completed!"
- Message: "You've practiced all items in this exercise. Reset to start again?"
- Buttons: "Cancel", "Reset & Start"
- On reset: API call to reset cycle → create new session → navigate to session

---

### 3.6 Exercise Session (`/exercises/session/:sessionId`)

**Purpose**: The active exercise session. Presents 10 items one at a time and collects user answers.

**Layout**:
- Fixed header: progress bar + item counter + "Stop" button
- Main area: current exercise component (varies by type)
- Optional: "Show Rules" button (if topic has grammar rules)

**Header Elements**:

| Element | Details |
|---------|---------|
| Progress bar | Linear, shows X/10 items completed |
| Item counter | Text: "3 of 10" |
| Show Rules button | Opens grammar rules dialog (only shown if topic has rules) |
| Stop button | Opens Stop Exercise confirmation dialog |

**Exercise Area**:

The main area renders one of four exercise components depending on the session's exercise type. See [Section 4](#4-exercise-ui-components) for detailed component specs.

**Session Flow**:
1. Render first item
2. User answers → feedback shown (correct/incorrect)
3. Advance to next item (auto on correct, manual on incorrect)
4. After item 10: submit all answers → navigate to results

**Grammar Rules Dialog**:
- Modal dialog
- Title: topic name
- Content: HTML-rendered grammar rules (may include tables, formatted text)
- Close button

---

### 3.7 Grammar Session Results (`/exercises/results/:sessionId`)

**Purpose**: Show the outcome after completing a grammar exercise session.

**Layout**:
- Centered content card
- Score, XP, streak displayed prominently
- Two action buttons

**UI Elements**:

| Element | Details |
|---------|---------|
| Score display | Large: "7 / 10 correct" or percentage |
| XP earned | "+70 XP" with star icon |
| Streak | "🔥 5 days" (current streak after this session) |
| Continue button | Primary — goes back to topic page and auto-starts same exercise type |
| Back to Exercises | Secondary — navigates to `/exercises/grammar` |

**Design Notes**:
- Results should feel rewarding even for partial success
- Streak increase should be visually highlighted if the streak grew

---

### 3.8 Vocabulary Hub (`/exercises/vocabulary`)

**Purpose**: Entry point for all vocabulary practice modes. Users choose how they want to practice.

**Layout**:
- Page title + subtitle
- Vertical list of cards (single column, full-width)
- Learn Words card → Speed Quiz card → horizontal divider → 4 individual practice cards

```
┌───────────────────────────────────────┐
│  🎓  Learn Words                      │  ← primary border
│      Guided 4-step vocabulary session │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│  ⏱  Speed Quiz                        │  ← warning border
│      Test your fully-learned words    │
└───────────────────────────────────────┘
────────────────────────────────────────
┌───────────────────────────────────────┐
│  🔤  Word to Translate                │
│      See Croatian word, type meaning  │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│  Aa  Translate to Word                │
│      See meaning, type Croatian       │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│  ⊞   Letter Pick                      │
│      Build the Croatian word          │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│  🎧  Matching                         │
│      Pair words with translations     │
└───────────────────────────────────────┘
```

**Learn Words Card**:
- Outlined border in primary color
- Entire card is tappable (no separate button)
- Navigates to `/exercises/vocabulary/learn` — passes `?collectionId` if present in the current URL

**Speed Quiz Card**:
- Outlined border in warning color (amber/orange)
- Only uses fully-learned words (`learnedOnly` flag; ignores `?collectionId`)
- Tapping immediately creates a practice session and navigates to `/exercises/vocabulary/speed-quiz`
- While loading: timer icon replaced by an inline spinner; card is disabled
- **Not enough words error**: warning alert shown above the card list

**Divider**: horizontal rule between the two featured cards and the four individual practice modes.

**Individual Practice Mode Cards**:

| Mode | Icon | Description |
|------|------|-------------|
| Word to Translate | Translate icon | See Croatian word → type translation in native language |
| Translate to Word | TextFields icon | See native translation → type the Croatian word |
| Letter Pick | Grid icon | Reconstruct the Croatian word by tapping letter tiles |
| Matching | Hearing icon | Pair all 10 Croatian words with their translations |

Each card:
- Entire card is tappable (`CardActionArea`) — no separate button
- Icon replaced by an inline spinner while that mode's session is being created
- All other cards disabled while any session is in progress

**Errors**:

| Error | Trigger | Display |
|-------|---------|---------|
| No words available | Individual practice fails (empty dictionary) | Error alert above card list |
| Not enough learned words | Speed Quiz fails | Warning alert above card list |

**URL Parameter**: `?collectionId=xxx` is only forwarded to the Learn Words flow. Speed Quiz and the 4 individual practice modes ignore it.

---

### 3.9 Learn Words Setup (`/exercises/vocabulary/learn`)

**Purpose**: Step 1 of the guided Learn Words flow. User configures how many words to practice and which words to prioritize.

**Layout**:
- Step indicator: 4 steps, step 1 highlighted
- Settings form
- "Next" button

**UI Elements**:

| Element | Details |
|---------|---------|
| Step indicator | 4 chips/dots: Setup (active) → Preview → Practice → Results |
| Word count selector | Segmented control / toggle: 5 / 10 / 15 / 20 |
| Filter selector | Segmented control / toggle: Newest / Oldest / By Progress |
| Next button | Fetches word preview, then navigates to preview page |

**States**:
- Loading: "Next" button disabled + spinner while words are fetched
- Error: Alert if no words available for the selected filter

**Notes for Designer**:
- The setup should feel quick and lightweight — don't over-complicate it
- Word count and filter are the only decisions the user needs to make

---

### 3.10 Learn Words Preview (`/exercises/vocabulary/learn/preview`)

**Purpose**: Step 2. User previews each selected word before practicing. Words are shown one at a time with auto-pronunciation.

**Layout**:
- Step indicator (step 2 active)
- Large word card (centered)
- Navigation controls

**UI Elements**:

| Element | Details |
|---------|---------|
| Step indicator | 4 chips: Setup (done) → Preview (active) → Practice → Results |
| Progress dots | One dot per word: filled (seen) / current (pulsing) / empty (upcoming) |
| Word card | Large Croatian word on top, translation below |
| Speaker indicator | Small icon showing audio played automatically |
| Next / Start Exercises button | "Next" for words 1–N-1; "Start Exercises" on last word |
| Stop button | Top right → Stop Exercise confirmation dialog |

**Behavior**:
- Each new word automatically plays the Croatian word via text-to-speech (if speech is enabled in settings)
- User can advance manually at any pace
- Last word changes button label to "Start Exercises" → navigates to session

---

### 3.11 Learn Words Session (`/exercises/vocabulary/learn/session`)

**Purpose**: Step 3. Runs 4 sequential sub-exercises for the selected words.

**Layout**:
- Step indicator (step 3 active)
- Sub-step chips: Letter Pick → Word to Translate → Translate to Word → Matching
- Exercise area (renders the current sub-exercise component)

**Sub-Step Chips**:

```
[✓ Letter Pick]  [→ Word→Translate]  [Translate→Word]  [Matching]
```

| State | Visual |
|-------|--------|
| Completed | Filled chip with checkmark |
| Current | Highlighted/primary chip |
| Pending | Outlined/ghost chip |

**Sub-Exercise Order**:
1. **Letter Pick** — Reconstruct the Croatian word from shuffled tiles (easiest — recognition)
2. **Word to Translate** — See Croatian word → type translation
3. **Translate to Word** — See translation → type Croatian word
4. **Matching** — Pair all words with translations at once (hardest — no scaffolding)

Each sub-exercise uses the same component UI as standalone practice (see [Section 4](#4-exercise-ui-components)).

**Behavior**:
- Sub-exercises complete automatically when the last item is answered
- XP/streak are only updated after all 4 sub-exercises (not between steps)
- "Stop" button is available throughout → Stop Exercise dialog

---

### 3.12 Learn Words Results (`/exercises/vocabulary/learn/results`)

**Purpose**: Step 4. Aggregated results across all 4 sub-exercises.

**Layout**:
- Step indicator (step 4 / all done)
- Results summary card
- Two action buttons

**UI Elements**:

| Element | Details |
|---------|---------|
| Step indicator | All 4 chips filled/completed |
| Total score | Aggregated correct answers across all 4 sub-exercises (e.g. "34 / 40") |
| XP earned | "+340 XP" — total from the whole session |
| Current streak | "🔥 5 days" |
| Learn Again button | Returns to Setup (`/exercises/vocabulary/learn`) |
| Back to Dictionary | Navigates to `/dictionary/my` |

---

### 3.12a Speed Quiz Session (`/exercises/vocabulary/speed-quiz`)

**Purpose**: A timed multiple-choice quiz that tests retention of fully-learned words under time pressure. Each word has a 5-second countdown. Failing a word twice resets its progress to 0%.

**Layout**:
- Header row (title + progress + stop button)
- Linear progress bar
- Question card (timer + Croatian word + 3 answer buttons)

**Header**:

```
┌─────────────────────────────────────────────────┐
│  ⏱ Speed Quiz          3 / 12        [✕ Stop]   │
├─────────────────────────────────────────────────┤
│  [█████████░░░░░░░░░░░░░░░░░░░] progress bar    │
└─────────────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Timer icon + title | "Speed Quiz" in h6 |
| Progress counter | "N / Total" — questions answered vs total (including retries) |
| Stop button | Error-colored; opens Stop Exercise Dialog |
| Progress bar | Reflects `doneCount / (totalWords + retryQueueLength)` |

**Question Card**:

```
┌──────────────────────────────────────────┐
│                   5                      │  ← countdown (primary color)
│                                          │
│           kuća                           │  ← Croatian word
│                                          │
│  [ house                               ] │  ← option button
│  [ head                                ] │
│  [ hand                                ] │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Countdown number | Large, centered; color shifts: primary → warning-light → warning → error as time runs low (5 → 3 → 2 → 1) |
| Croatian word | Large bold heading; auto-played via text-to-speech on each new question |
| Option buttons | 3 full-width outlined buttons; left-aligned text |

**Answer Feedback** (shown immediately on tap or timeout, for ~1–2 seconds before auto-advance):

| Outcome | Button appearance |
|---------|-------------------|
| Correct option | Green background + green border |
| Wrong selected option | Red background + red border |
| Correct option (when wrong was tapped) | Also turns green so user sees the right answer |

**Retry Logic**:
- First wrong answer: word added to retry queue (seen again after all other words)
- Second wrong answer on same word: word's progress reset to 0% (recorded as `speedQuizOutcome`)
- Timeout (5 s with no answer): treated as wrong

**Auto-advance**:
- Correct answer: next question after 1 second
- Wrong answer / timeout: next question after 2 seconds

**Session End**:
- After all words and retries are exhausted, session results submitted automatically
- Navigates to `/dictionary/practice/results/:sessionId` (same results screen as dictionary practice)

**States**:

| State | Behavior |
|-------|---------|
| Submitting | Spinner shown while session is being finalized (replaces card) |
| Submit error | Error alert shown; quiz stays on last question |

**Dialogs / Modals**:

- [Stop Exercise Dialog](#stop-exercise-dialog) — opens when user taps Stop; abandons session and returns to `/exercises/vocabulary`

---

### 3.13 Dictionary Practice Session (`/dictionary/practice/:sessionId`)

**Purpose**: Active standalone dictionary practice session (not the guided Learn Words flow). Supports 4 practice modes (word-to-translate, translate-to-word, letter-pick, matching).

**Layout** (for sequential modes: word-to-translate, translate-to-word, letter-pick):
- Progress bar + item counter (X of 10)
- Stop button (top right)
- Current exercise component

**Layout** (for matching mode):
- Stop button (top right)
- Full matching component (all 10 pairs visible at once — no progress bar)

**Behavior**:
- Sequential modes: advance one item at a time
- After last item: finish session → navigate to results
- "Stop" → Stop Exercise confirmation dialog

See [Section 4](#4-exercise-ui-components) for individual component specs.

---

### 3.14 Dictionary Practice Results (`/dictionary/practice/results/:sessionId`)

**Purpose**: Show results after completing a standalone dictionary practice session.

**Layout**:
- Centered results card
- Score, XP, streak
- Two buttons

**UI Elements**:

| Element | Details |
|---------|---------|
| Score | "7 / 10 correct" |
| XP earned | "+70 XP" |
| Streak | "🔥 5 days" |
| Practice Again | Repeats the same mode — creates new session |
| Back button | Returns to previous page (My Dictionary or Vocabulary Hub) |

---

### 3.15 My Dictionary (`/dictionary/my`)

**Purpose**: The user's personal word collection. Words are added manually and practiced here.

**URL parameter**: `?collectionId=xxx` — filters the list to show only words from a specific collection.

**Layout**:
- Top bar (sort + search + actions + filter)
- Word list (infinite scroll)
- Batch action bar (appears when words are selected)

#### Top Bar

```
[Sort ▼]  [🔍 Search words...]   [+ Add Word]  [Practice]  [☐ Hide learned]
```

All controls sit on a single row (wraps on narrow viewports).

| Element | Details |
|---------|---------|
| Sort dropdown | Selects sort order — see options below; defaults to "Newest first" |
| Search field | Single field; searches both Croatian word (`wordHr`) and translation simultaneously. Typing in your native language filters by translation; typing Croatian filters by word. Press Enter in non-empty field to open Add Word modal pre-filled with the search term. |
| Add Word button | Opens Add Word Modal |
| Practice button | Navigates to `/exercises/vocabulary/learn?collectionId=xxx` (if collection filtered) or `/exercises/vocabulary/learn` |
| Hide learned checkbox | When checked, words with 100% progress across all 4 exercise types are excluded from the list |

**Sort options**:

| Value | Behaviour |
|-------|-----------|
| Newest first (default) | Most recently added words appear first |
| Oldest first | Earliest added words appear first |
| Word (A–Z) | Alphabetical by Croatian word |
| Collection (A–Z) | Grouped alphabetically by collection name (localized); words with no collection appear last |
| Progress (low → high) | Words with lowest average progress appear first |

#### Word List

Each row:

```
[☐]  kuća                   Odjeća (localized)   [Learned ✓]   [↺] [✏] [🔊] [🗑]
     house
```

or, for in-progress words:

```
[☐]  kuća                   Odjeća (localized)   ████░░ 55%    [🎓] [↺] [✏] [🔊] [🗑]
     house
```

| Column | Details |
|--------|---------|
| Checkbox | Select for batch actions |
| Croatian word | Bold, primary text |
| Translation | Below the word, secondary text |
| Collection name | Which collection the word belongs to (empty if none); displayed in user's native language for predefined collections |
| Progress | Either a green "Learned" chip (when all 4 exercise types are at 100%) or a percentage / progress bar (average of 4 per-type values) |
| Mark as Learned icon | Shown when word is not yet fully learned; sets all 4 progress values to 100% |
| Reset Progress icon | Shown when word has any progress > 0%; resets all 4 progress values to 0 |
| Edit icon | Opens Edit Word Modal |
| Speaker icon | Plays Croatian word pronunciation via text-to-speech |
| Delete icon | Opens Delete Word confirmation dialog |

**Progress model**: Each word tracks 4 independent progress values (0–100%), one per exercise type (`wordToTranslate`, `translateToWord`, `letterPick`, `matching`). The displayed percentage is the average of all four. A word is **Learned** when all four reach 100%.

#### Batch Selection Mode

When one or more checkboxes are checked, a batch action bar appears:

```
[3 words selected]   Assign to: [Collection dropdown ▼]   [Assign]
```

| Element | Details |
|---------|---------|
| Selection count | "X words selected" |
| Collection dropdown | Select a collection to assign words to |
| Assign button | Saves the assignment for all selected words |
| Deselect | Click elsewhere or uncheck all to exit batch mode |

#### States

| State | Behavior |
|-------|---------|
| Loading | Skeleton rows |
| Empty (no words) | Illustration + "No words yet. Add your first word!" + Add Word button |
| Empty (filtered) | "No words in this collection." + Browse Word Sets button |
| Loading more | Spinner at bottom of list while next page loads |
| Error | Alert banner with retry |

#### Add Word Modal

Triggered by "Add Word" button or Enter in search with no match.

```
┌──────────────────────────────────────┐
│  Add Word                       [✕]  │
│                                      │
│  Croatian word                       │
│  [kuća                          ]    │
│                                      │
│  Translation suggestions:            │
│  [house] [home] [building]           │
│                                      │
│  Translation                         │
│  [house                         ]    │
│                                      │
│  Collection (optional)               │
│  [None ▼                        ]    │
│                                      │
│                         [Add Word]   │
└──────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Croatian word field | Text input; triggers translation suggestions after 2+ characters |
| Suggestion chips | Clickable — tap to populate translation field; show how many users use each translation |
| Translation field | Free text; can be filled from suggestion or typed manually |
| Collection dropdown | Optional; defaults to "None" |
| Add Word button | Submits; disabled while loading |
| Duplicate error | Inline error below form if word already exists in dictionary |

#### Edit Word Modal

Same layout as Add Word Modal, pre-populated with existing values.

#### Delete Word Dialog

See [Section 5 — Shared Dialogs](#5-shared-dialogs).

---

### 3.16 My Collections (`/dictionary/my-collections`)

**Purpose**: View and manage personal and predefined word collections.

**Layout**:
- Two sections with headings
- Collection cards in each section
- "Create Collection" button (top right or at bottom of personal section)

#### Section 1: "From Word Sets" (read-only)

Collections the user has imported words from (admin-created predefined sets). These are read-only — no edit or delete.

```
┌────────────────────────┐
│  Body Parts            │
│  32 words              │
└────────────────────────┘
```

| Element | Details |
|---------|---------|
| Collection name | Admin-defined name |
| Word count | How many words from this set the user has added |
| Click | Navigates to `/dictionary/my?collectionId=xxx` |

#### Section 2: "My Collections" (user-created)

```
┌────────────────────────┐
│  Travel Words    [✏][🗑]│
│  15 words              │
└────────────────────────┘
```

| Element | Details |
|---------|---------|
| Collection name | User-defined |
| Word count | Number of words in this collection |
| Edit icon | Opens Create/Edit Collection Modal (pre-populated) |
| Delete icon | Opens Delete confirmation dialog |
| Click | Navigates to `/dictionary/my?collectionId=xxx` |

#### Create / Edit Collection Modal

```
┌──────────────────────────────────────┐
│  Create Collection             [✕]   │
│                                      │
│  Name                                │
│  [Travel Words                  ]    │
│                                      │
│  Description (optional)              │
│  [Words I use when traveling...  ]   │
│                                      │
│                          [Save]      │
└──────────────────────────────────────┘
```

#### States

| State | Behavior |
|-------|---------|
| No personal collections | "No collections yet." + Create Collection button |
| No predefined collections | Section hidden |

---

### 3.17 Recommended Word Sets (`/dictionary/recommended-word-sets`)

**Purpose**: Browse admin-created predefined word collections. Users can import words from these into their personal dictionary.

**Layout**:
- Page title + subtitle (explaining what word sets are)
- Grid of collection cards (responsive)

**Collection Card**:

```
┌─────────────────────────────────┐
│  Body Parts                     │
│  Common body part vocabulary    │
│                    [48 words]   │
└─────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Collection name | Bold heading |
| Description | Optional short description |
| Word count chip | "48 words" |
| Click | Navigates to `/dictionary/collections/:collectionId` (preview page) |

**States**:
- Loading: Skeleton cards
- Empty: "No word sets available yet."

---

### 3.18 Collection Preview (`/dictionary/collections/:collectionId`)

**Purpose**: Preview all words in a predefined word set and selectively import them into personal dictionary.

**Layout**:
- Back button + collection name as title
- Word count
- Select All checkbox
- Word table
- "Add Selected" button (sticky or at top/bottom)

**Word Table**:

```
[☐]  Croatian Word       Translation         [🔊]
[☐]  glava               head                [🔊]
[☐]  ruka                arm, hand           [🔊]
```

| Column | Details |
|--------|---------|
| Checkbox | Select individual words |
| Croatian word | Bold |
| Translation | In user's native language (auto-selected by server) |
| Speaker icon | Click to pronounce the Croatian word via text-to-speech |

**Select All**:
- Checkbox in header row
- Indeterminate state when some (but not all) rows selected

**Add Selected Button**:
- Disabled when no rows are selected
- Shows "Add Selected (12)" with count when rows are selected
- On click: bulk-import selected words → success snackbar
- Snackbar message: "12 words added, 3 already in your dictionary"

**States**:
- Loading: Table skeleton
- All words already owned: "Add Selected" button disabled; indication that all words are already in dictionary

---

### 3.19 Settings (`/settings`)

**Purpose**: User preferences for UI language and audio behavior.

**Layout**:
- Page title "Settings"
- Two settings sections

#### Section: Native Language

```
Your native language
[Russian]  [Ukrainian]  [English]
```

- Segmented toggle / button group
- Currently selected language is highlighted
- Changing language: updates server + immediately re-renders entire UI in the new language

#### Section: Speech

```
Speech
Auto-play Croatian words during exercises     [toggle ON/OFF]
```

- Toggle switch
- When ON: Croatian words are automatically read aloud during word preview and exercises
- When OFF: no auto-play; user can manually trigger playback per-word if a speaker icon is present
- Persisted to `localStorage` (not server — purely a device preference)

---

## 4. Exercise UI Components

These components are reused across both grammar sessions and vocabulary practice sessions.

---

### 4.1 Type the Answer

Used in: Grammar (TYPE_THE_ANSWER), Vocabulary (word-to-translate, translate-to-word)

**Layout**:
```
┌──────────────────────────────────────────┐
│  What is the translation of:             │
│                                          │
│  kuća                                    │
│  (dom, house — shown as hint context)    │
│                                          │
│  [Type your answer...          ] [Hint]  │
│                                          │
│  [Check]                                 │
│                                          │
│  ✓ Correct!                              │
│  or                                      │
│  ✗ Incorrect. The answer is: house       │
│                                          │
│  [Next →]                                │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Prompt | Croatian word (or translation, depending on direction) |
| Context text | Translation shown as soft context below prompt |
| Text input | Auto-focused; pressing Enter submits |
| Hint button | Reveals the next character of the correct answer; marks item as incorrect |
| Check button | Submits answer (same as pressing Enter) |
| Feedback area | Green "✓ Correct!" or red "✗ Incorrect. The answer is: X" |
| Next button | Appears after answer is checked; auto-click after 1000ms on correct |

**Answer Validation**:
- Case-insensitive
- Trim whitespace
- NFC Unicode normalization (handles accented characters)

**States**:
- `idle`: Input + Check button visible; feedback hidden
- `correct`: Green feedback; Next button shown; auto-advances after 1s
- `incorrect`: Red feedback + correct answer shown; Next button shown (manual advance)
- `hinted`: Hint was used — treated as incorrect even if final answer is right

---

### 4.2 Flashcard

Used in: Grammar (FLASHCARDS)

**Layout**:
```
┌──────────────────────────────────────────┐
│                                          │
│         ┌──────────────────┐             │
│         │                  │             │
│         │   kuća           │  ← front    │
│         │                  │             │
│         │   (tap to flip)  │             │
│         └──────────────────┘             │
│                                          │
│   [✗ I didn't know]    [✓ I knew it]    │
│                                          │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Card front | Croatian word/phrase |
| Card back (after flip) | Translation in user's native language |
| Flip trigger | Tap/click anywhere on the card |
| "I knew it" button | Green; marks as correct; advances to next item |
| "I didn't know" button | Red; marks as incorrect; advances to next item |

**States**:
- `front`: Shows Croatian word; action buttons disabled (must flip first)
- `flipped`: Shows translation; action buttons enabled

---

### 4.3 Fill in the Blank

Used in: Grammar (FILL_IN_BLANK)

**Layout**:
```
┌──────────────────────────────────────────┐
│  Complete the sentence:                  │
│                                          │
│  Ona ima jednu _____ .                   │
│  (She has one house.)                    │
│                                          │
│  [Type the missing word...     ] [Hint]  │
│                                          │
│  [Check]                                 │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Sentence | Croatian sentence with the blank shown as underlined gap or `_____` |
| Translation | Full sentence translation shown below for context |
| Input field | Auto-focused for the missing word |
| Hint + Check | Same behavior as Type the Answer (see 4.1) |

---

### 4.4 Letter Pick

Used in: Grammar vocabulary practice, Learn Words Step 1

**Layout**:
```
┌──────────────────────────────────────────┐
│  Build this word:  house                 │
│                                          │
│  K U Ć _ _          ← constructed so far │
│                                          │
│  [K] [U] [Ć] [A] [N] [E]  ← letter pool │
│                                          │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Prompt | Shows the translation as a hint ("Build: house") |
| Constructed word | Shows chosen letters so far; placeholders for remaining letters |
| Letter pool | Shuffled letter tiles as clickable buttons |
| Used tile | Tile becomes invisible/empty spacer once tapped |

**Behavior**:
- Tap a tile → adds letter to constructed word
- Wrong letter added → tiles flash red briefly; constructed word resets; user tries again
- Correct word completed → green flash → auto-advances after 1s

**Notes**:
- The pool contains all letters of the correct answer plus some decoy letters
- Letter matching is case-insensitive and accent-aware (NFC normalized)

---

### 4.5 Matching

Used in: Learn Words Step 4, standalone Matching practice mode

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Match all pairs                                     │
│                                                      │
│  [kuća]       [hand]                                 │
│  [glava]      [house]    ← tapped, highlighted       │
│  [ruka]       [head]                                 │
│  ...          ...                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Left column | Croatian words (all 10 visible) |
| Right column | Translations (all 10 visible, shuffled) |
| Selection | Tap a word → highlight it; then tap a translation to pair |

**Pairing Behavior**:
- Correct pair: both items turn green and "lock" (removed from active pool visually)
- Wrong pair: both items flash red (500ms) then deselect
- Complete when all 10 pairs are matched
- No "Check" button — validation is immediate on each pair attempt

---

### 4.6 Build a Sentence

Used in: Grammar (BUILD_SENTENCE)

**Layout**:
```
┌──────────────────────────────────────────┐
│  Build the Croatian sentence:            │
│                                          │
│  She watches theatre performances.       │
│                                          │
│  [ Katerina ] [ gleda ] ← built so far  │
│                                          │
│  Word 3 of 4                             │
│  [kazališne]  [puno]  [rijetko]          │
│  [brzo]       [uvijek] [nikad]           │
│                                          │
└──────────────────────────────────────────┘
```

| Element | Details |
|---------|---------|
| Instruction | "Build the Croatian sentence:" |
| Native translation | Full sentence in user's native language shown as the prompt |
| Built-so-far row | Blue chips for words already selected (during selecting); the **last chip** has an × delete button that undoes the last selection; green/red chips after completion |
| Word counter | "Word N of M" — shows position of the slot currently being filled |
| Option buttons | 6 outlined buttons (1 correct + 5 distractors) arranged in a **3-column grid**; each button shows a small numbered badge (1–6); keyboard shortcuts 1–6 select the corresponding option; tapping/pressing fills the current slot and advances to the next |

**After all words are chosen**:

| Outcome | Behaviour |
|---------|-----------|
| All correct | Built-so-far chips turn green; correct sentence spoken aloud; auto-advance after 1.5 s |
| Any wrong | Wrong chips turn red with strikethrough; correct word shown above in green; correct sentence spoken aloud; user presses **Next** / **Finish** to advance |

**States**:
- `selecting`: Option buttons visible (3-column grid, keys 1–6); built-so-far shows blue chips; last chip has × undo button
- `correct`: Green success alert + auto-advance timer running
- `incorrect`: Red alert with correct sentence shown; Next/Finish button visible

---

## 5. Shared Dialogs

### Stop Exercise Dialog

Appears when user taps "Stop" during any active exercise or preview session.

```
┌──────────────────────────────────────┐
│  Stop exercise?                      │
│                                      │
│  Your progress in this session       │
│  will be lost.                       │
│                                      │
│             [Continue]  [Stop]       │
└──────────────────────────────────────┘
```

- "Continue": dismisses dialog, resumes exercise
- "Stop": abandons session, navigates back

### Delete Word Dialog

Appears when user taps delete icon on a word.

```
┌──────────────────────────────────────┐
│  Delete "kuća"?                      │
│                                      │
│  This word will be removed from      │
│  your dictionary.                    │
│                                      │
│             [Cancel]  [Delete]       │
└──────────────────────────────────────┘
```

- "Cancel": dismisses dialog
- "Delete": removes word; snackbar confirms deletion

### Cycle Reset Dialog

Appears when user tries to start a grammar exercise but has completed all items in the current cycle.

```
┌──────────────────────────────────────┐
│  All items completed!                │
│                                      │
│  You've practiced all items in       │
│  this exercise. Reset to start       │
│  the cycle again?                    │
│                                      │
│             [Cancel]  [Reset]        │
└──────────────────────────────────────┘
```

- "Cancel": returns to topic page
- "Reset": resets progress cycle, starts new session

### Grammar Rules Dialog

```
┌──────────────────────────────────────┐
│  Nouns: Plural Forms          [✕]    │
│  ──────────────────────────────────  │
│                                      │
│  [HTML-rendered grammar content]     │
│   May include tables, lists, etc.    │
│                                      │
│                        [Got it]      │
└──────────────────────────────────────┘
```

- Scrollable if content is long
- HTML content rendered as rich text (may include tables, bold, italic)

---

## 6. Navigation Map

```
[GUEST]
    /login
        ↓ (first login)
    /language-select
        ↓
    / (home)

[AUTHENTICATED]
    / ─────────────────────────────────── Home

    Header: Exercises ▼
        ├─ /exercises/grammar ─────────── Topics list
        │       └─ /exercises/:topicId ── Exercise type selector
        │               └─ /exercises/session/:id ── Active session
        │                       └─ /exercises/results/:id ── Results
        │
        └─ /exercises/vocabulary ──────── Vocabulary hub
                ├─ /exercises/vocabulary/learn ────── Setup (Step 1)
                │       └─ .../learn/preview ─────── Preview (Step 2)
                │               └─ .../learn/session ─── Practice (Step 3)
                │                       └─ .../learn/results ── Results (Step 4)
                └─ /exercises/vocabulary/speed-quiz ── Speed Quiz session
                        └─ /dictionary/practice/results/:id ── Results (shared)

    Header: Dictionary ▼
        ├─ /dictionary/my ─────────────── Personal words
        │       (+ ?collectionId filter)
        │
        ├─ /dictionary/my-collections ─── Collections list
        │
        ├─ /dictionary/recommended-word-sets ── Browse word sets
        │       └─ /dictionary/collections/:id ── Preview & import
        │
        └─ /dictionary/practice/:id ───── Active practice session
                └─ /dictionary/practice/results/:id ── Results

    Header: User Menu ▼
        └─ /settings ──────────────────── Language + speech preferences
```

---

## 7. Gamification System

### XP (Experience Points)

- **Earned**: 10 XP per correct answer in any exercise or practice session
- **Displayed**: 
  - Header chip: "⭐ 340" (total XP)
  - Results screen: "+70 XP earned this session"
- **No level system** in current implementation — raw XP total only

### Streak

- **Logic**: Streak increments by 1 if the user practiced on the previous calendar day
- **Reset**: Streak resets to 0 if a day is missed
- **Displayed**:
  - Header chip: "🔥 5" (current streak in days)
  - Results screens after each session
- **Design note**: Streak is a key retention mechanism — should be visually prominent, especially when the streak increases

### Progress Percentage (Dictionary words only)

- Per-word metric: average of 4 independent per-exercise-type values (`wordToTranslate`, `translateToWord`, `letterPick`, `matching`), each ranging 0–100%
- Correct answer in Learn Words: `+25%` (clamped to 100); word is **Learned** when all 4 reach 100%
- Shown in the word list as a percentage or a green "Learned" chip
- Can be manually set to 100% ("Mark as Learned" button) or reset to 0% ("Reset Progress" button) per word

---

## 8. Internationalization

### Supported Languages

The UI is fully translated into three languages. The user selects their native language during onboarding and can change it in Settings.

| Language | Code | Flag |
|----------|------|------|
| Russian | `ru` | 🇷🇺 |
| Ukrainian | `uk` | 🇺🇦 |
| English | `en` | 🇬🇧 |

### What is translated

- All UI labels, buttons, headings, error messages
- Exercise instructions and feedback messages
- Topic names and grammar rules (content is multilingual)
- Translation suggestions in the dictionary (shown in user's language)

### What is always in Croatian

- Croatian words being practiced (`wordHr`)
- Croatian sentences in Fill in the Blank exercises
- Letter tiles in Letter Pick exercises

### Design Considerations

- **Russian and Ukrainian strings are longer than English** — design layouts with buffer for 20–40% longer text
- Avoid fixed-width containers for text — use flexible layouts
- The language switcher in the header (for guests) and in Settings must be immediately accessible
- Language change takes effect instantly — no page reload required

---

## 9. Design Notes & Constraints

### Visual Direction

The visual design is entirely the designer's to define — there are no existing mockups or brand guidelines. The current implementation uses Material UI (MUI) as a component library, but the designer should not feel constrained by MUI's default styling.

**Design goals** to keep in mind:
- The target audience is adult learners (20–45 years old) — avoid overly "child-like" educational app aesthetics
- Encourage daily habit — streak and XP should feel motivating, not pressuring
- The app is used in focused study sessions — minimize distractions, maximize readability

### Typography

- Croatian uses Latin script with diacritics: `č`, `ć`, `š`, `ž`, `đ`
- Russian and Ukrainian use Cyrillic script
- The chosen typeface must support both Latin (with Croatian diacritics) and Cyrillic

### Responsive Breakpoints

The web app is used primarily on desktop and tablet. Mobile web is secondary (the company has native mobile apps for iOS and Android). Design should prioritize:
1. Desktop (1280px+)
2. Tablet (768px–1279px)
3. Mobile web (below 768px) — functional but not primary

### Accessibility

- All interactive elements must have keyboard focus states
- Color alone should not convey meaning (e.g. correct/incorrect feedback should use icons + color)
- Minimum touch target size: 44×44px
- Form inputs need visible labels (not just placeholder text)

### Exercise Session Immersion

During active exercise sessions (`/exercises/session/:sessionId` and practice pages), the UI should be distraction-free:
- Minimal header (just progress + stop)
- No footer
- Focus on the current item

### Audio / Speech

- The app uses the Web Speech API for text-to-speech
- No visual audio player UI is needed — just a speaker icon button where manual playback is available
- Auto-play is a toggle preference in Settings

---

## 10. Mobile Design — FUTURE

> **Status: FUTURE FEATURE**
> 
> This section describes mobile design requirements that are **not yet implemented**. The native mobile app (iOS + Android) is planned for Phase 3 of development. Responsive web improvements for small screens are also planned as part of that phase. The designer should plan with these requirements in mind but implementation is not in the current scope.

---

### 10.1 Responsive Web (Mobile Browser)

The current web app is primarily built for desktop and tablet. Mobile browser support needs dedicated design work.

#### Header — Mobile

The desktop header with dropdown menus does not translate well to mobile. Required changes:

| Current (desktop) | Required (mobile) |
|-------------------|-------------------|
| Horizontal nav with dropdown menus | Hamburger menu (☰) → slide-in drawer |
| XP + streak chips in header | Remain in header (compact) |
| Full logo text | Icon-only logo or shortened wordmark |

**Mobile Drawer** (opens from hamburger):
- User avatar + name + XP + streak at the top
- Navigation links: Grammar, Vocabulary, My Dictionary, Collections, Word Sets
- Divider
- Settings, Logout

#### Bottom Navigation Bar (alternative to drawer)

Consider a sticky bottom tab bar as a primary mobile navigation pattern:

```
[Exercises]  [Dictionary]  [Settings]
```

This is more thumb-friendly and matches mobile app conventions. The drawer could be secondary for less frequent actions.

#### Screen-Specific Adaptations

| Screen | Mobile adaptation needed |
|--------|--------------------------|
| Grammar Topics (`/exercises/grammar`) | Single-column card grid |
| My Dictionary (`/dictionary/my`) | Simplified row — hide collection name column; move to expandable detail |
| Batch actions | Move "Assign to Collection" to a bottom sheet instead of inline bar |
| Collection Preview (`/dictionary/collections/:id`) | Scrollable list instead of table; sticky "Add Selected" button pinned to bottom |
| Matching exercise | Vertical stacked layout (words on top, translations below) instead of side-by-side columns |
| Word Sets grid | Single-column cards |

#### Keyboard & Input on Mobile

- On screens with text input (Type the Answer, Fill in Blank, Add Word): the keyboard pushes content up — ensure the input and action buttons remain visible above the keyboard
- Exercise session progress bar must remain visible above the keyboard
- Consider using `inputmode` attributes to show the appropriate mobile keyboard type

---

### 10.2 Native Mobile App (iOS & Android)

The native app is built with **Expo (React Native)** and uses **Expo Router** for navigation. It will be a separate codebase (`apps/mobile/`) but shares all backend APIs and design patterns with the web app.

The designer should create a **separate set of designs** for native mobile following platform conventions. The web designs cannot be directly reused for native mobile.

#### Platform

| Platform | Target | Navigation pattern |
|----------|--------|--------------------|
| iOS | iPhone (primary), iPad | Bottom tab bar + stack navigation |
| Android | Phone (primary), tablet | Bottom tab bar + stack navigation |

#### Navigation Structure (Native)

```
[Bottom Tab Bar]
    ├─ Home tab          ← Dashboard (streak, XP, quick start)
    ├─ Exercises tab     ← Grammar + Vocabulary entry points
    └─ Profile tab       ← Settings, streak, XP history, logout
```

Within each tab, screens push onto a stack (standard native navigation):

```
Exercises tab:
    Grammar Topics list
        → Topic Exercise Selector
            → Active Session (full screen, no tab bar)
                → Results
    Vocabulary Hub
        → Learn Words Setup
            → Preview (full screen)
                → Session (full screen)
                    → Results
        → Practice mode
            → Active Practice (full screen)
                → Results
```

Dictionary is accessible via the Exercises tab or a dedicated tab (designer's decision).

#### Key Differences vs Web

| Aspect | Web | Native Mobile |
|--------|-----|---------------|
| Navigation | React Router, URL-based | Expo Router, file-based, native stack transitions |
| Header | MUI AppBar | Native navigation header (back button, title) |
| Bottom nav | Dropdown menus in top header | Sticky bottom tab bar |
| Exercises | Full-page layout | Full-screen, no tab bar during active session |
| Auth | Google OAuth (code flow via browser) | Expo Auth Session + Expo Web Browser (Google), Native Apple Sign-In (iOS only) |
| Token storage | `localStorage` | `expo-secure-store` (encrypted native storage) |
| Text-to-speech | Web Speech API | Expo AV or `expo-speech` |
| Payments | Stripe (web checkout) | RevenueCat (App Store IAP / Google Play Billing) |

#### Screens Required for Native Mobile

All screens from Section 3 of this document need native mobile equivalents, plus:

| Screen | Mobile-specific notes |
|--------|-----------------------|
| Login | Apple Sign-In button shown on iOS only; no email/password toggle (future) |
| Home / Dashboard | Streak visualization is the focal point; large daily goal indicator |
| Exercise Session | Full-screen, status bar hidden or minimal; haptic feedback on correct/incorrect |
| Matching exercise | Vertically stacked — words above, translations below |
| My Dictionary | Swipe-to-delete gesture on word rows (standard mobile pattern) |
| Settings | Native list/section layout; language selection uses native picker or action sheet |
| Paywall | Full-screen paywall; RevenueCat purchase buttons; trial countdown |

#### Paywall Screen (Native — FUTURE)

> Required for Phase 4 (Subscriptions + Payments). Not yet designed or implemented.

**Elements**:
- App value proposition (3 benefit bullets)
- Trial status (e.g. "3 days left in your free trial")
- Plan options: Monthly / Annual (with savings badge)
- Primary CTA: "Start Free Trial" or "Subscribe"
- Legal: Terms of Service + Privacy Policy links
- Restore Purchases link (required by App Store guidelines)

#### Push Notifications (Native — FUTURE)

> Required for Phase 4. Not yet designed.

Notification types the designer should plan for:
- **Daily reminder**: "Time to practice Croatian! 🔥 Keep your streak going."
- **Trial expiry warning (48h)**: "Your trial ends in 2 days — subscribe to keep learning."
- **Trial expiry warning (2h)**: "Last chance! Your trial expires in 2 hours."
- **Streak at risk**: "Don't break your 7-day streak! Practice today."

Each notification should have:
- App icon visible in notification tray
- Short, motivating copy
- Deep link to the relevant screen (exercises or paywall)
