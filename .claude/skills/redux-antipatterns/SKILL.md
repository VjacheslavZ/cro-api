---
name: redux-antipatterns
description: Redux anti-patterns, deprecated APIs, and bad practices to avoid in the cro-web store. Enforced automatically when reading or modifying any file in apps/web/src/store/.
paths:
  - "apps/web/src/store/**/*.ts"
---

# Redux Anti-Patterns & Deprecated APIs — Do Not Use

These patterns are **forbidden** in `apps/web/src/store/`. When you encounter any of them during a read or edit, flag it and rewrite using the correct RTK pattern.

---

## 1. Deprecated & Removed APIs

### `createStore` (removed in Redux 5)
```ts
// ❌ Removed — do not use
import { createStore } from 'redux';
const store = createStore(rootReducer);

// ✅ RTK replacement
import { configureStore } from '@reduxjs/toolkit';
const store = configureStore({ reducer: rootReducer });
```

### `combineReducers` from `redux` directly
```ts
// ❌ Avoid importing from 'redux' when RTK re-exports it
import { combineReducers } from 'redux';

// ✅ Import from RTK or just use configureStore's reducer object
import { combineReducers } from '@reduxjs/toolkit';
// or: pass a plain object to configureStore({ reducer: { ... } })
```

### `applyMiddleware` + manual middleware setup
```ts
// ❌ Legacy — middleware is configured via configureStore
import { applyMiddleware, createStore } from 'redux';
const store = createStore(reducer, applyMiddleware(thunk));

// ✅ RTK configures redux-thunk automatically
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(myMiddleware),
});
```

### `redux-thunk` imported directly
```ts
// ❌ RTK bundles thunk — do not install or import separately
import thunk from 'redux-thunk';

// ✅ Use createAsyncThunk from RTK
import { createAsyncThunk } from '@reduxjs/toolkit';
```

### `connect()` HOC from `react-redux`
```ts
// ❌ Deprecated — class-era pattern
import { connect } from 'react-redux';
export default connect(mapStateToProps, mapDispatchToProps)(MyComponent);

// ✅ Use hooks
const value = useAppSelector((state) => state.slice.value);
const dispatch = useAppDispatch();
```

### `mapStateToProps` / `mapDispatchToProps`
```ts
// ❌ Only valid with connect() — both are forbidden
const mapStateToProps = (state) => ({ user: state.auth.user });
const mapDispatchToProps = (dispatch) => ({ logout: () => dispatch(logoutAction()) });
```

---

## 2. Manual Reducer Patterns (pre-RTK)

### Hand-written switch-case reducers
```ts
// ❌ Forbidden — use createSlice
function authReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_USER':
      return { ...state, user: null };
    default:
      return state;
  }
}
```

### Manual action type string constants
```ts
// ❌ Forbidden — createSlice generates these automatically
const SET_USER = 'auth/setUser';
const CLEAR_USER = 'auth/clearUser';
```

### Hand-written action creator functions
```ts
// ❌ Forbidden — createSlice generates these automatically
const setUser = (user) => ({ type: SET_USER, payload: user });
const clearUser = () => ({ type: CLEAR_USER });
```

### Manual spread for immutability inside reducers
```ts
// ❌ Forbidden inside createSlice — Immer handles immutability
return { ...state, user: action.payload };
return { ...state, items: [...state.items, newItem] };

// ✅ Write directly — Immer converts to immutable update
state.user = action.payload;
state.items.push(newItem);
```

---

## 3. State Shape Anti-Patterns

### Non-serializable values in state
```ts
// ❌ Breaks Redux DevTools, causes warnings, serialization failures
state.createdAt = new Date();         // Date object — use ISO string
state.handler = () => doSomething();  // function — never in state
state.ref = new MyClass();            // class instance — never in state
state.pending = fetchData();          // Promise — never in state

// ✅ Serialize before storing
state.createdAt = new Date().toISOString();
```

### Derived or computed data stored in state
```ts
// ❌ Stale derived data — state.isLoggedIn can drift from state.user
state.isLoggedIn = state.user !== null;
state.displayName = `${state.user.firstName} ${state.user.lastName}`;

// ✅ Compute in a selector — always in sync
export const selectIsLoggedIn = (state: RootState) => state.auth.user !== null;
export const selectDisplayName = createSelector(
  (state: RootState) => state.auth.user,
  (user) => user ? `${user.name}` : '',
);
```

### Server/API data in Redux slices
```ts
// ❌ Wrong — API responses belong in TanStack Query
const topicsSlice = createSlice({
  name: 'topics',
  initialState: { list: [], loading: false },
  reducers: { setTopics(state, action) { state.list = action.payload; } },
});

// ✅ Use TanStack Query in src/api/
export function useTopics() {
  return useQuery({ queryKey: ['topics'], queryFn: fetchTopics });
}
```

### Deeply nested state
```ts
// ❌ Hard to update, hard to read
state.ui.modals.confirmDelete.isOpen = true;

// ✅ Flatten the shape
state.isConfirmDeleteOpen = true;
```

---

## 4. Component-Level Anti-Patterns

### Accessing the store directly in components
```ts
// ❌ Bypasses React rendering — component won't re-render on state changes
import { store } from '../store';
const user = store.getState().auth.user;

// ✅ Subscribe via selector hook
const user = useAppSelector((state) => state.auth.user);
```

### Raw `useSelector` / `useDispatch` instead of typed hooks
```ts
// ❌ Loses TypeScript inference — RootState is unknown
import { useSelector, useDispatch } from 'react-redux';
const user = useSelector((state: any) => state.auth.user);

// ✅ Always use project-typed hooks
import { useAppSelector, useAppDispatch } from '../store';
const user = useAppSelector((state) => state.auth.user);
```

### Dispatching plain objects instead of action creators
```ts
// ❌ Bypasses type safety, breaks if action type string ever changes
dispatch({ type: 'auth/setUser', payload: user });

// ✅ Use the generated action creator
dispatch(setUser(user));
```

### Using Redux for component-local state
```ts
// ❌ Pollutes global store with state nothing else needs
const isDropdownOpen = useAppSelector((state) => state.ui.headerDropdownOpen);

// ✅ Keep local state local
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
```

---

## 5. Async Anti-Patterns

### `async` logic directly inside reducers
```ts
// ❌ Reducers must be pure and synchronous
reducers: {
  async fetchUser(state) {          // ❌ async reducer
    const user = await getUser();
    state.user = user;
  },
}

// ✅ Use createAsyncThunk for async operations
export const fetchUser = createAsyncThunk('auth/fetchUser', async () => {
  const { data } = await apiClient.get('/users/me');
  return data;
});
```

### Side effects inside reducers
```ts
// ❌ Reducers must be pure — no side effects
reducers: {
  setUser(state, action) {
    state.user = action.payload;
    localStorage.setItem('user', JSON.stringify(action.payload)); // ❌ side effect
    analytics.track('user_set');                                  // ❌ side effect
  },
}

// ✅ Side effects belong in middleware, thunks, or useEffect
// For localStorage persistence, follow the pattern in preferences.slice.ts:
// call saveToStorage(state) — which is a plain function call, not an I/O side effect
// that violates purity in a meaningful way for this use case.
// For analytics: dispatch from the component after the action resolves.
```

### Thunk logic written as plain functions instead of `createAsyncThunk`
```ts
// ❌ Hand-rolled thunk — loses built-in pending/fulfilled/rejected lifecycle
export const fetchUser = () => async (dispatch) => {
  dispatch({ type: 'auth/loading' });
  const user = await getUser();
  dispatch({ type: 'auth/setUser', payload: user });
};

// ✅ createAsyncThunk provides lifecycle actions automatically
export const fetchUser = createAsyncThunk('auth/fetchUser', async () => getUser());
```

---

## 6. Performance Anti-Patterns

### New object/array reference created in every selector call
```ts
// ❌ Returns a new array reference every render — causes infinite re-renders
const items = useAppSelector((state) => state.auth.user?.roles ?? []);
//                                                               ^^^ new [] every call

// ✅ Define a stable fallback outside, or use createSelector
const EMPTY_ARRAY: string[] = [];
const items = useAppSelector((state) => state.auth.user?.roles ?? EMPTY_ARRAY);
```

### Over-selecting — subscribing to the entire slice
```ts
// ❌ Component re-renders on any slice change
const auth = useAppSelector((state) => state.auth);
const { user } = auth;

// ✅ Select only what the component needs
const user = useAppSelector((state) => state.auth.user);
```

### Missing `createSelector` for expensive derived computations
```ts
// ❌ Re-computed on every render
const expensiveValue = useAppSelector((state) =>
  state.auth.items.filter(x => x.active).reduce(...)
);

// ✅ Memoized with createSelector — only recomputes when inputs change
export const selectActiveItemsTotal = createSelector(
  (state: RootState) => state.auth.items,
  (items) => items.filter(x => x.active).reduce(...),
);
```
