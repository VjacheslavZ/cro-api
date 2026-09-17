import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '@/components/Spinner';
import { useAppSelector, useAppDispatch } from '@/store';

import { authClient } from '../lib/auth-client';
import { clearAuth } from '../store/auth.slice';
import { fetchMe } from '../api/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (session && !user && !loading) {
      dispatch(fetchMe());
    } else if (!session && user) {
      dispatch(clearAuth());
    }
  }, [session, isPending, user, loading, dispatch, location.pathname]);

  if (isPending || (session != null && user == null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function LanguageGuard({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  if (user && !user.nativeLanguage) return <Navigate to="/language-select" replace />;
  return <>{children}</>;
}

/** Layout route: PrivateRoute + LanguageGuard for every nested <Route>. */
export function ProtectedLayout() {
  return (
    <PrivateRoute>
      <LanguageGuard>
        <Outlet />
      </LanguageGuard>
    </PrivateRoute>
  );
}
