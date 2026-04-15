---
name: web-query-patterns
description: TanStack Query hook patterns for the cro-web API layer. Auto-loads when editing src/api/ files. Covers useQuery, useMutation, useInfiniteQuery, response typing, and query key conventions.
paths:
  - "apps/web/src/api/**/*.ts"
---

# Web TanStack Query Patterns

Apply these patterns when creating or modifying any hook in `apps/web/src/api/`.

All hooks use the shared `apiClient` (axios with JWT interceptors) from `./client`.

---

## 1. Query Hook (GET)

```ts
export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data } = await apiClient.get<ExerciseTopic[]>('/content/topics');
      return data;
    },
  });
}
```

**Rules:**
- Always type the response: `apiClient.get<ResponseType>(...)` — never use `any`
- Destructure `{ data }` from axios response — never return the full axios response object
- `queryKey` first element is the resource name string; add params as additional elements

---

## 2. Mutation Hook (POST / PATCH / DELETE)

```ts
export function useAddWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { wordHr: string; translation: string; collectionId?: string }) => {
      const { data } = await apiClient.post('/dictionary/words', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-words'] });
    },
  });
}
```

**Rules:**
- `useQueryClient()` inside the hook, not outside — hooks must be called inside function bodies
- Always `invalidateQueries` on success for the affected resource key
- For mutations that update a specific item, also invalidate the item's own key if it exists
- No optimistic updates — the web app refetches after mutation success

---

## 3. Infinite Query Hook (cursor-based pagination)

```ts
export function useDictionaryWords(params: { search?: string; collectionId?: string }) {
  return useInfiniteQuery<PaginatedResponse<DictionaryWord>>({
    queryKey: ['dictionary-words', params],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get('/dictionary/words', {
        params: { ...params, cursor: pageParam, limit: 20 },
      });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

**Rules:**
- `initialPageParam: undefined as string | undefined` — explicit type cast needed for TS
- `getNextPageParam` returns `undefined` (not `null`) to signal end of pages
- Include all filter params in `queryKey` so the query re-fetches when filters change
- `PaginatedResponse<T>` from `@cro/shared` — use the shared type, don't inline it

---

## 4. Conditional Query (enabled flag)

```ts
export function useCollectionWords(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collection-words', collectionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/dictionary/collections/${collectionId}/words`);
      return data;
    },
    enabled: !!collectionId,  // don't fire if param is undefined
  });
}
```

---

## 5. Query Key Conventions

Always use these exact keys — never invent variants:

| Key | Hook | Resource |
|-----|------|----------|
| `['topics']` | `useTopics` | All active exercise topics |
| `['topic', topicId]` | `useTopic` | Single topic detail |
| `['session', sessionId]` | `useSession` | Exercise session |
| `['dictionary-words', params]` | `useDictionaryWords` | Paginated user word list |
| `['dictionary-collections']` | `useDictionaryCollections` | User + predefined collections |
| `['collection-preview', collectionId]` | `useCollectionPreview` | Words in a specific collection |
| `['translation-suggestions', word]` | `useTranslationSuggestions` | Shared translation pool |
| `['dictionary-practice', sessionId]` | `useDictionaryPractice` | Dictionary practice session |

**Invalidation rule**: when a word is added, updated, or deleted always invalidate `['dictionary-words']` (partial match covers all param variants). When a collection is created, updated, or deleted invalidate `['dictionary-collections']`.

---

## 6. File Organization

One file per domain in `src/api/`:

| File | Owns |
|------|------|
| `auth.ts` | `fetchMe` thunk (Redux), login/logout — not TanStack Query |
| `content.ts` | `useTopics`, `useTopic`, `useTopicItems` |
| `exercises.ts` | `useCreateSession`, `useFinishSession`, `useSession` |
| `dictionary.ts` | All dictionary words, collections, practice, suggestions |

**Don't** put hooks in component files — all server-state hooks belong in `src/api/`.
