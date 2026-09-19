import { configureStore } from '@reduxjs/toolkit';

import { authReducer, setUser, clearAuth, type UserProfile } from './auth.slice';
import { preferencesReducer } from './preferences.slice';
import { fetchMe } from '../api/auth';

const profile: UserProfile = {
  id: 'user1',
  email: 'a@b.com',
  name: 'A',
  avatarUrl: null,
  role: 'STUDENT',
  nativeLanguage: 'EN',
  theme: 'SYSTEM',
  xpTotal: 10,
  currentStreak: 1,
};

function createTestStore() {
  return configureStore({ reducer: { auth: authReducer, preferences: preferencesReducer } });
}

describe('auth.slice', () => {
  it('has null user and loading=false as the initial state', () => {
    const store = createTestStore();
    expect(store.getState().auth).toEqual({ user: null, loading: false });
  });

  it('setUser sets the user in state', () => {
    const store = createTestStore();
    store.dispatch(setUser(profile));
    expect(store.getState().auth.user).toEqual(profile);
  });

  it('setUser adopts the theme stored on the profile', () => {
    const store = createTestStore();
    store.dispatch(setUser({ ...profile, theme: 'DARK' }));
    expect(store.getState().preferences.theme).toBe('DARK');
  });

  it('clearAuth clears the user', () => {
    const store = createTestStore();
    store.dispatch(setUser(profile));
    store.dispatch(clearAuth());
    expect(store.getState().auth.user).toBeNull();
  });

  it('fetchMe.pending sets loading=true', () => {
    const store = createTestStore();
    store.dispatch({ type: fetchMe.pending.type });
    expect(store.getState().auth.loading).toBe(true);
  });

  it('fetchMe.fulfilled sets the user and loading=false', () => {
    const store = createTestStore();
    store.dispatch({ type: fetchMe.pending.type });
    store.dispatch({ type: fetchMe.fulfilled.type, payload: profile });
    expect(store.getState().auth).toEqual({ user: profile, loading: false });
  });

  it('fetchMe.rejected clears the user and sets loading=false', () => {
    const store = createTestStore();
    store.dispatch(setUser(profile));
    store.dispatch({ type: fetchMe.pending.type });
    store.dispatch({ type: fetchMe.rejected.type });
    expect(store.getState().auth).toEqual({ user: null, loading: false });
  });
});
