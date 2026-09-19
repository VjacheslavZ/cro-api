import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const THEME_VALUES = ['SYSTEM', 'LIGHT', 'DARK'] as const;
export type ThemeValue = (typeof THEME_VALUES)[number];

export function isTheme(value: unknown): value is ThemeValue {
  return typeof value === 'string' && (THEME_VALUES as readonly string[]).includes(value);
}

interface PreferencesState {
  speechEnabled: boolean;
  theme: ThemeValue;
}

const DEFAULTS: PreferencesState = { speechEnabled: true, theme: 'SYSTEM' };

// Also read by the pre-hydration script in `index.html` — keep the key and the
// `{ speechEnabled, theme }` shape in sync with it.
const STORAGE_KEY = 'cro_preferences';

function loadFromStorage(): PreferencesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PreferencesState>;
      return {
        ...DEFAULTS,
        ...parsed,
        theme: isTheme(parsed.theme) ? parsed.theme : DEFAULTS.theme,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
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
    setTheme(state, action: PayloadAction<string>) {
      if (!isTheme(action.payload) || state.theme === action.payload) return;
      state.theme = action.payload;
      saveToStorage(state);
    },
  },
});

export const { setSpeechEnabled, setTheme } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
