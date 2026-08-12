import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import { authReducer } from '../store/auth.slice';
import { preferencesReducer } from '../store/preferences.slice';
import type { RootState } from '../store';
import '../i18n';

export function renderWithProviders(ui: ReactElement, preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      preferences: preferencesReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });

  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
