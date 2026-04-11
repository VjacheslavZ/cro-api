import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { CircularProgress } from '@mui/material';

import { useAppSelector, useAppDispatch } from '../store';
import { clearAuth } from '../store/auth.slice';
import { fetchMe } from '../api/auth';
import {
  isAuthenticated as checkAuth,
  getRefreshToken,
  isTokenExpired,
  clearTokens,
} from '../shared/lib/auth-storage';
import { LoginPage } from '../features/auth/LoginPage';
import { LanguageSelectPage } from '../features/auth/LanguageSelectPage';
import { ExercisesPage } from '../features/exercises/ExercisesPage';
import { VocabularyPage } from '../features/exercises/VocabularyPage';
import { TopicExercisesPage } from '../features/exercises/TopicExercisesPage';
import { SessionPage } from '../features/exercises/SessionPage';
import { SessionResultsPage } from '../features/exercises/SessionResultsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { MyDictionaryPage } from '../features/dictionary/MyDictionaryPage/MyDictionaryPage.tsx';
import { CollectionsPage } from '../features/dictionary/CollectionsPage';
import { WordSetsPage } from '../features/dictionary/WordSetsPage';
import { CollectionPreviewPage } from '../features/dictionary/CollectionPreviewPage/CollectionPreviewPage.tsx';
import { DictionaryPracticePage } from '../features/dictionary/DictionaryPractice/DictionaryPracticePage.tsx';
import { DictionaryPracticeResultsPage } from '../features/dictionary/DictionaryPractice/DictionaryPracticeResultsPage.tsx';
import { LearnWordsSetupPage } from '../features/exercises/LearnWords/LearnWordsSetupPage';
import { LearnWordsPreviewPage } from '../features/exercises/LearnWords/LearnWordsPreviewPage';
import { LearnWordsSessionPage } from '../features/exercises/LearnWords/LearnWordsSessionPage';
import { LearnWordsResultsPage } from '../features/exercises/LearnWords/LearnWordsResultsPage';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken && isTokenExpired(refreshToken)) {
      clearTokens();
      dispatch(clearAuth());
      return;
    }
    if (!user && checkAuth()) {
      dispatch(fetchMe());
    }
  }, [location.pathname, user, dispatch]);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!checkAuth()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  if (checkAuth()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LanguageGuard({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  if (user && !user.nativeLanguage) return <Navigate to="/language-select" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Box component="main" sx={{ flex: 1 }}>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route path="/about" element={<div>About Us (placeholder)</div>} />
              <Route path="/partners" element={<div>For Partners (placeholder)</div>} />
              <Route path="/contacts" element={<div>Contacts (placeholder)</div>} />
              {/*{ Private routes }*/}
              <Route path="/exercises" element={<Navigate to="/exercises/grammar" replace />} />
              <Route
                path="/exercises/grammar"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <ExercisesPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/vocabulary"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <VocabularyPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/vocabulary/learn"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <LearnWordsSetupPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/vocabulary/learn/preview"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <LearnWordsPreviewPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/vocabulary/learn/session"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <LearnWordsSessionPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/vocabulary/learn/results"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <LearnWordsResultsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/:topicId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <TopicExercisesPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/session/:sessionId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <SessionPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/results/:sessionId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <SessionResultsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/my"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <MyDictionaryPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/my-collections"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <CollectionsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/recommended-word-sets"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <WordSetsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/collections/:collectionId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <CollectionPreviewPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/practice/:sessionId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <DictionaryPracticePage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dictionary/practice/results/:sessionId"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <DictionaryPracticeResultsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <SettingsPage />
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
              <Route
                path="/language-select"
                element={
                  <PrivateRoute>
                    <LanguageSelectPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <LanguageGuard>
                      <div>Home (placeholder)</div>
                    </LanguageGuard>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </AuthGuard>
    </BrowserRouter>
  );
}
