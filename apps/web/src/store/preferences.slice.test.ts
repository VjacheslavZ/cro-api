import { configureStore } from '@reduxjs/toolkit';

const STORAGE_KEY = 'cro_preferences';

describe('preferences.slice', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  it('defaults speechEnabled to true when localStorage is empty', async () => {
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual({ speechEnabled: true });
  });

  it('loads speechEnabled from localStorage when present', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ speechEnabled: false }));
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual({ speechEnabled: false });
  });

  it('falls back to the default when localStorage holds invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual({ speechEnabled: true });
  });

  it('setSpeechEnabled updates state and persists to localStorage', async () => {
    const { preferencesReducer, setSpeechEnabled } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });

    store.dispatch(setSpeechEnabled(false));

    expect(store.getState().preferences.speechEnabled).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      speechEnabled: false,
    });
  });
});
