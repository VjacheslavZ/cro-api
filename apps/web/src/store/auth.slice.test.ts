import { configureStore } from '@reduxjs/toolkit';

import { authReducer, setUser, setCredentials, clearAuth, type UserProfile } from './auth.slice';
import { fetchMe } from '../api/auth';

const profile: UserProfile = {
  id: 'user1',
  email: 'a@b.com',
  name: 'A',
  avatarUrl: null,
  role: 'STUDENT',
  nativeLanguage: 'EN',
  xpTotal: 10,
  currentStreak: 1,
};

function createTestStore() {
  return configureStore({ reducer: { auth: authReducer } });
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

  it('setCredentials sets the user in state', () => {
    const store = createTestStore();
    store.dispatch(setCredentials({ user: profile }));
    expect(store.getState().auth.user).toEqual(profile);
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
