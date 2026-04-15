---
name: jsdoc-rules
description: JSDoc documentation rules for high-value TypeScript files. Auto-loads when editing services, API hooks, store slices, shared types, and utilities. Always add or update JSDoc as part of any edit to a covered file.
paths:
  - "packages/shared/src/**/*.ts"
  - "apps/api/src/modules/**/*.service.ts"
  - "apps/web/src/api/**/*.ts"
  - "apps/web/src/store/**/*.ts"
  - "apps/admin/src/api/**/*.ts"
  - "apps/*/src/shared/lib/**/*.ts"
---

# JSDoc Rules

**Core rule**: Whenever you create or modify a file matched by this skill's paths, you MUST:
1. Add the file-level JSDoc block if it is missing
2. Add function-level JSDoc to every exported function/method/thunk if missing
3. Update any JSDoc that no longer matches the current signature or behavior

Do this as part of the same edit — not as a separate step.

---

## File-Level Block

Every covered file gets one block at the very top (before imports):

```ts
/**
 * @module ModuleName
 * @description What this file does in 1–3 sentences. Include key behaviors,
 * constraints, and non-obvious design decisions.
 * @usedBy ConsumerA, ConsumerB
 */
```

- `@module` — the class name, hook group name, or slice name (e.g. `DictionaryService`, `dictionary (API hooks)`, `authSlice`)
- `@description` — what it does, not how. Mention key design choices (e.g. cursor pagination, Immer mutation, shared translation pool)
- `@usedBy` — direct consumers: controller, component, slice, or other service that imports this file. Keep updated as consumers change.

---

## Function-Level Templates

### NestJS Service Method

```ts
/**
 * Brief description of what this method does (one sentence).
 * @param userId - The authenticated user's ID
 * @param dto - Validated DTO with the request fields
 * @returns The created or updated entity, or void for deletions
 */
async methodName(userId: string, dto: SomeDto): Promise<Entity> {
```

- Include `@param` for every parameter
- For `dto` params: name the DTO type in the description
- For optional params: mark them — `@param cursor - Optional pagination cursor`
- `@returns` should describe the shape, not just repeat the TypeScript type

### TanStack Query Hook (Query)

```ts
/**
 * Brief description — what data this hook fetches and key query behavior.
 * @param params.search - Optional search string (Croatian word)
 * @param params.collectionId - Optional collection filter
 * @returns Infinite query pages of PaginatedResponse<DictionaryWord>
 */
export function useMyQuery(params: { search?: string }) {
```

- For infinite queries: mention cursor-based pagination in `@returns`
- For enabled/disabled queries: document the `enabled` param and when the query fires

### TanStack Query Hook (Mutation)

```ts
/**
 * Brief description — what this mutation does and what cache it invalidates.
 * On success: invalidates ['query-key'] and updates the word list.
 * @returns Mutation result with the created/updated entity
 */
export function useMyMutation() {
```

- Always mention which query keys are invalidated on success — this is non-obvious and important
- No `@param` needed when the hook takes no arguments (params are passed to `mutate()`)

### Redux `createAsyncThunk`

```ts
/**
 * Brief description of the async operation.
 * Dispatched by: AppRouter (AuthGuard), Header
 * On fulfilled: sets state.auth.user
 * On rejected: clears state.auth.user, sets loading = false
 */
export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
```

- "Dispatched by" replaces `@usedBy` for thunks — list the components/hooks that call `dispatch(fetchMe())`
- "On fulfilled / On rejected" documents the state change without reading the slice

### Redux Slice Reducer

```ts
/**
 * Brief description — what state this reducer sets and when it's called.
 * @param action.payload - The new value to set
 */
setUser(state, action: PayloadAction<UserProfile>) {
```

Only document reducers if the side effect (e.g. localStorage write) or behavior is non-obvious. Simple `state.x = action.payload` reducers don't need JSDoc.

### Exported Type / Interface (shared package)

```ts
/**
 * Brief description of what this type represents.
 * Used by: web app session, admin panel, mobile (Phase 3).
 */
export interface UserProfile {
```

- One line description + "Used by" to show which apps depend on this type
- For discriminated unions: explain the discriminant field

### Exported Enum (shared package)

```ts
/**
 * Brief description of what this enum represents and where values are used.
 * Stored in: UserDictionaryWord.translationLanguage
 * Used by: dictionary word CRUD, practice session filtering
 */
export enum NativeLanguage {
```

### Utility Function

```ts
/**
 * Brief description of what this utility does.
 * @param input - What this param is
 * @returns What is returned and why it is useful
 */
export function myUtil(input: string): string {
```

---

## Update Triggers

Update existing JSDoc immediately (in the same edit) when:

| Change | What to update |
|--------|---------------|
| Parameter added or removed | `@param` list in function JSDoc |
| Parameter renamed | `@param` tag name |
| Return type changes | `@returns` description |
| Method behavior changes | `@description` of the method |
| New consumer imports this file | `@usedBy` in the file-level block |
| Consumer removed | `@usedBy` in the file-level block |
| Query key for invalidation changes | mutation hook `@description` |
| State field name changes | thunk "On fulfilled" description |

---

## What NOT to Document

Skip JSDoc for these — they are in scope of paths but add noise:

- **Private/internal methods** (prefixed with `_` or not exported) — document only if logic is non-obvious
- **Simple one-liner reducers** that are just `state.x = action.payload` with no side effects
- **Re-exported types** — `export type { Foo } from './foo'` — document at the source
- **Test files** (`*.spec.ts`) — no JSDoc in tests

---

## Style Rules

- Write in **present tense**: "Returns", "Fetches", "Manages" — not "Will return" or "Used to return"
- **No redundancy**: don't repeat the TypeScript types in words (`@param userId string — the user id` → just `@param userId - The authenticated user's ID`)
- **One sentence** for `@description` when possible; two or three only for genuinely complex methods
- Use `—` (em dash) after `@param name` to separate name from description
- `@usedBy` is comma-separated, no `and` at the end
