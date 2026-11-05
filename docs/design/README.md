# Дизайн apps/web (холст Claude Design)

Исходники холста «CroGrammar Web — структура». Живая версия с режимом Play:
https://claude.ai/code/artifact/039387a2-165d-4939-bacd-9443ec759c36

Файлы `*.dc.html` — артборды в формате Design Component: обычный HTML со стилями inline,
но рендерятся только в редакторе Claude Design (подключают `./support.js` из среды холста),
поэтому напрямую в браузере открываются без логики. `canvas.json` — раскладка артбордов на холсте.

| Файл | Экран / роут |
| --- | --- |
| `Main.dc.html` | Схема архитектуры apps/web |
| `Header.dc.html`, `Footer.dc.html` | Общие компоненты layout (импортируются во все экраны) |
| `Login.dc.html` | `/login` |
| `LanguageSelect.dc.html` | `/language-select` (онбординг) |
| `Home.dc.html` | `/` |
| `Grammar.dc.html` | `/exercises/grammar` |
| `Topic.dc.html` | `/exercises/:topicId` |
| `Session.dc.html` | `/exercises/session/:sessionId` |
| `SessionResults.dc.html` | `/exercises/results/:sessionId` |
| `Vocabulary.dc.html` | `/exercises/vocabulary` |
| `LearnSetup.dc.html` | `/exercises/vocabulary/learn` |
| `LearnPreview.dc.html` | `/exercises/vocabulary/learn/preview` |
| `LearnSession.dc.html` | `/exercises/vocabulary/learn/session` |
| `LearnResults.dc.html` | `/exercises/vocabulary/learn/results` |
| `SpeedQuiz.dc.html` | `/exercises/vocabulary/speed-quiz` |
| `MyDictionary.dc.html` | `/dictionary/my` |
| `Collections.dc.html` | `/dictionary/my-collections` |
| `WordSets.dc.html` | `/dictionary/recommended-word-sets` |
| `CollectionPreview.dc.html` | `/dictionary/collections/:collectionId` |
| `DictPractice.dc.html` | `/dictionary/practice/:sessionId` |
| `DictPracticeResults.dc.html` | `/dictionary/practice/results/:sessionId` |
| `DictReview.dc.html` | `/dictionary/review/:sessionId` |
| `DictReviewResults.dc.html` | `/dictionary/review/results/:sessionId` |

User stories: `../user-stories.md`.
