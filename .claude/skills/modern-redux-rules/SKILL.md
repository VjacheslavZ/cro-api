---
name: modern-redux-rules
description: Modern Redux Toolkit (RTK) best practices and recommended patterns for the cro-web store. Apply when reading or modifying any file in apps/web/src/store/.
paths:
  - "apps/web/src/store/**/*.ts"
---

# Modern Redux Toolkit — Best Practices

This project uses Redux Toolkit (RTK). These recommendations apply to every file inside `apps/web/src/store/`.

---

## What Redux Owns in This App

Redux manages **exactly two things**:
- `auth` — authenticated user session (`user: UserProfile | null`, `loading: boolean`)
- `preferences` — local UI settings (`speechEnabled`) persisted to `localStorage`

**Everything else is TanStack Query.** Topics, exercises, sessions, dictionary words — all server data lives in `src/api/` hooks, not in Redux slices.

Decision rule: "Does this state need to be shared globally across unrelated routes with no common parent?"
- No → `useState` or `useReducer` locally
- Yes, but it's server data → TanStack Query
- Yes, and it's truly global session/UI state → Redux slice

---

## Slice Structure

Use `createSlice` for every reducer. Colocate actions and reducer in the same file:

```ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MyState {
  value: string;
  loading: boolean;
}

const initialState: MyState = { value: '', loading: false };

const mySlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setValue(state, action: PayloadAction<string>) {
      state.value = action.payload; // Immer handles immutability — write directly
    },
  },
});

export const { setValue } = mySlice.actions;
export const myReducer = mySlice.reducer;
```

---

## Async Operations — `createAsyncThunk`

```ts
export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
});
```

Handle all three states in `extraReducers`:

```ts
extraReducers: (builder) => {
  builder
    .addCase(fetchMe.pending,   (state) => { state.loading = true; })
    .addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload;
      state.loading = false;
    })
    .addCase(fetchMe.rejected,  (state) => {
      state.user = null;
      state.loading = false;
    });
},
```

---

## Typed Hooks

Always use the project's pre-typed hooks — never raw `useSelector` / `useDispatch`:

```ts
import { useAppSelector, useAppDispatch } from '../store';

const { user, loading } = useAppSelector((state) => state.auth);
const dispatch = useAppDispatch();
```

---

## Selectors

Simple field access: inline selector is fine.

Derived/computed values: use `createSelector` for memoization:

```ts
import { createSelector } from '@reduxjs/toolkit';

const selectUser = (state: RootState) => state.auth.user;

export const selectIsLoggedIn = createSelector(
  selectUser,
  (user) => user !== null,
);

export const selectUserInitials = createSelector(
  selectUser,
  (user) => user?.name.slice(0, 2) ?? '',
);
```

---

## Immer — Writing Reducers

Immer is built into RTK. Write "mutating" code inside reducers — it is safe and correct:

```ts
// All of these are correct inside createSlice reducers:
state.user = action.payload;
state.items.push(newItem);
state.items.splice(index, 1);
state.flags.enabled = true;
```

---

## localStorage Persistence Pattern

Follow the pattern from `preferences.slice.ts`:
1. Define a `STORAGE_KEY` constant at the top of the file
2. Load initial state with a `loadFromStorage()` function
3. Call `saveToStorage(state)` at the end of each reducer that changes persisted fields

---

## Registering a New Slice

Add the reducer to `store/index.ts`:

```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    preferences: preferencesReducer,
    myFeature: myFeatureReducer, // add here
  },
});
```

`RootState` and `AppDispatch` are inferred automatically — no manual type changes needed.

---

## New Slice Checklist

- [ ] `interface MyFeatureState` with all fields typed
- [ ] `initialState: MyFeatureState` defined
- [ ] `createSlice` with `name`, `initialState`, `reducers`
- [ ] Named action creators exported from `mySlice.actions`
- [ ] Reducer exported as `myFeatureReducer`
- [ ] Registered in `store/index.ts`
- [ ] Use `useAppSelector` / `useAppDispatch` in components
