import { configureStore } from '@reduxjs/toolkit';

const STORAGE_KEY = 'cro_preferences';
const DEFAULTS = { speechEnabled: true, theme: 'SYSTEM' };

describe('preferences.slice', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  it('uses the defaults when localStorage is empty', async () => {
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual(DEFAULTS);
  });

  it('loads stored values when present', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ speechEnabled: false, theme: 'DARK' }));
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual({ speechEnabled: false, theme: 'DARK' });
  });

  it('fills missing keys from the defaults (older stored shape)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ speechEnabled: false }));
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual({ speechEnabled: false, theme: 'SYSTEM' });
  });

  it('falls back to SYSTEM when the stored theme is not a known value', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ speechEnabled: true, theme: 'purple' }));
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences.theme).toBe('SYSTEM');
  });

  it('falls back to the defaults when localStorage holds invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const { preferencesReducer } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });
    expect(store.getState().preferences).toEqual(DEFAULTS);
  });

  it('setSpeechEnabled updates state and persists to localStorage', async () => {
    const { preferencesReducer, setSpeechEnabled } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });

    store.dispatch(setSpeechEnabled(false));

    expect(store.getState().preferences.speechEnabled).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      speechEnabled: false,
      theme: 'SYSTEM',
    });
  });

  it('setTheme updates state and persists to localStorage', async () => {
    const { preferencesReducer, setTheme } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });

    store.dispatch(setTheme('LIGHT'));

    expect(store.getState().preferences.theme).toBe('LIGHT');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      speechEnabled: true,
      theme: 'LIGHT',
    });
  });

  it('setTheme ignores unknown values', async () => {
    const { preferencesReducer, setTheme } = await import('./preferences.slice');
    const store = configureStore({ reducer: { preferences: preferencesReducer } });

    store.dispatch(setTheme('DARK'));
    store.dispatch(setTheme('neon'));

    expect(store.getState().preferences.theme).toBe('DARK');
  });
});
