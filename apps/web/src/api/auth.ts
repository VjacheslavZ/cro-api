import { createAsyncThunk } from '@reduxjs/toolkit';

import { apiClient } from './client';
import type { UserProfile } from '../store/auth.slice';
import { setTheme } from '../store/preferences.slice';

export const fetchMe = createAsyncThunk<UserProfile>(
  'auth/fetchMe',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<UserProfile>('/users/me');
      dispatch(setTheme(data.theme));
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
