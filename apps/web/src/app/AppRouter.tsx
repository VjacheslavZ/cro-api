import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';

import { LoginPage } from '../features/auth/LoginPage';
import { LanguageSelectPage } from '../features/auth/LanguageSelectPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { HomePage } from '../features/home/HomePage';
import { LessonsPage } from '../features/lessons/LessonsPage';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthGuard, GuestRoute, PrivateRoute, ProtectedLayout } from './guards';
import { ExercisesRoutes } from './routes/ExercisesRoutes';
import { DictionaryRoutes } from './routes/DictionaryRoutes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
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
              <Route
                path="/language-select"
                element={
                  <PrivateRoute>
                    <LanguageSelectPage />
                  </PrivateRoute>
                }
              />
              {/* Private routes (PrivateRoute + LanguageGuard) */}
              <Route path="/exercises/*" element={<ExercisesRoutes />} />
              <Route path="/dictionary/*" element={<DictionaryRoutes />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/lessons" element={<LessonsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthGuard>
    </BrowserRouter>
  );
}
