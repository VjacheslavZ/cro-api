import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Dispatch } from 'redux';

// import { clearTokens } from '../shared/lib/auth-storage';
import { fetchMe } from '../api/auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  nativeLanguage: string | null;
  xpTotal: number;
  currentStreak: number;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    _setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
    },
    _clearUser(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export function setCredentials(payload: { user: UserProfile }) {
  return (dispatch: Dispatch) => {
    dispatch(authSlice.actions._setUser(payload.user));
  };
}

export function setUser(user: UserProfile) {
  return (dispatch: Dispatch) => {
    dispatch(authSlice.actions._setUser(user));
  };
}

export function clearAuth() {
  return (dispatch: Dispatch) => {
    // clearTokens();
    dispatch(authSlice.actions._clearUser());
  };
}

export const authReducer = authSlice.reducer;
