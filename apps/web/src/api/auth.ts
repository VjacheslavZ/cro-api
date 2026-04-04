import { createAsyncThunk } from '@reduxjs/toolkit';

import { apiClient } from './client';
import type { UserProfile } from '../store/auth.slice';

export const fetchMe = createAsyncThunk<UserProfile>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<UserProfile>('/users/me');
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);
