import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PreferencesState {
  speechEnabled: boolean;
}

const STORAGE_KEY = 'cro_preferences';

function loadFromStorage(): PreferencesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PreferencesState;
  } catch {
    // ignore
  }
  return { speechEnabled: true };
}

function saveToStorage(state: PreferencesState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: loadFromStorage(),
  reducers: {
    setSpeechEnabled(state, action: PayloadAction<boolean>) {
      state.speechEnabled = action.payload;
      saveToStorage(state);
    },
  },
});

export const { setSpeechEnabled } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
