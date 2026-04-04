import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { I18nextProvider } from 'react-i18next';

import { store } from '../store';
import { queryClient } from '../api/query-client';
import i18n from '../i18n';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </I18nextProvider>
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
