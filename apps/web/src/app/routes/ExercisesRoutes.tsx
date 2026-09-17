import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedLayout } from '../guards';
import { ExercisesPage } from '../../features/exercises/ExercisesPage';
import { VocabularyPage } from '../../features/exercises/VocabularyPage';
import { TopicExercisesPage } from '../../features/exercises/TopicExercisesPage/TopicExercisesPage.tsx';
import { SessionPage } from '../../features/exercises/SessionPage';
import { SessionResultsPage } from '../../features/exercises/SessionResultsPage';
import { LearnWordsSetupPage } from '../../features/exercises/LearnWords/LearnWordsSetupPage';
import { LearnWordsPreviewPage } from '../../features/exercises/LearnWords/LearnWordsPreviewPage';
import { LearnWordsSessionPage } from '../../features/exercises/LearnWords/LearnWordsSessionPage';
import { LearnWordsResultsPage } from '../../features/exercises/LearnWords/LearnWordsResultsPage';
import { SpeedQuizPage } from '../../features/exercises/SpeedQuiz/SpeedQuizPage';

/** Mounted at `/exercises/*` — all paths below are relative to that prefix. */
export function ExercisesRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="grammar" replace />} />
        <Route path="grammar" element={<ExercisesPage />} />
        <Route path="vocabulary" element={<VocabularyPage />} />
        <Route path="vocabulary/learn" element={<LearnWordsSetupPage />} />
        <Route path="vocabulary/learn/preview" element={<LearnWordsPreviewPage />} />
        <Route path="vocabulary/learn/session" element={<LearnWordsSessionPage />} />
        <Route path="vocabulary/learn/results" element={<LearnWordsResultsPage />} />
        <Route path="vocabulary/speed-quiz" element={<SpeedQuizPage />} />
        <Route path="session/:sessionId" element={<SessionPage />} />
        <Route path="results/:sessionId" element={<SessionResultsPage />} />
        <Route path=":topicId" element={<TopicExercisesPage />} />
      </Route>
    </Routes>
  );
}
