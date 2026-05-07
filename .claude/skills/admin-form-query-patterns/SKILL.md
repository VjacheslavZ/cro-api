---
name: admin-form-query-patterns
description: Admin panel coding patterns for React Hook Form + Zod forms, TanStack Query mutations and queries, and query key conventions. Auto-loads when editing admin feature files.
paths:
  - "apps/admin/src/features/**/*.tsx"
  - "apps/admin/src/features/**/*.ts"
---

# Admin Form & Query Patterns

Apply these patterns whenever creating or modifying code in `apps/admin/src/features/`.

---

## 1. React Hook Form + Zod Form Pattern

Every Create/Edit form must follow this structure:

```tsx
const schema = z.object({
  field: z.string().min(1, 'Required').max(100),
  numField: z.coerce.number().int().min(0),  // z.coerce.number() for ALL number inputs
  boolField: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema) as never,        // "as never" cast — always required
  defaultValues: item                            // always explicit defaultValues
    ? { field: item.field, numField: item.numField }
    : { field: '', numField: 0 },
});
```

**Rules:**
- `zodResolver(schema) as never` — the TypeScript cast is always required; never omit it
- `z.coerce.number()` for every number field — HTML inputs always return strings
- Always provide explicit `defaultValues` for every field (create: empty strings/zeros, edit: item values)
- When a form is reused for both create and edit (controlled by an `editing` prop), reset on prop change:
  ```tsx
  useEffect(() => {
    reset(editing ?? defaultValues);
  }, [editing, reset]);
  ```

---

## 2. Mutation Pattern

```tsx
const mutation = useMutation({
  mutationFn: async (data: FormData) => {
    if (isEditing) {
      await apiClient.patch(`/admin/resource/${item.id}`, data);
    } else {
      await apiClient.post('/admin/resource', data);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
    onDone();
  },
  onError: (err: unknown) => {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? 'An error occurred';
    setError(message);
  },
});
```

**Rules:**
- **No optimistic updates** — admin tolerates a brief refetch; always use `invalidateQueries` on success, never manually update the cache
- `mutation.isPending` disables the submit button — never introduce a separate local loading boolean for this
- Display errors inline with `<Alert severity="error">` — never use `alert()`
- Extract server error message from `err.response.data.message`; fall back to `'An error occurred'`
- Submit button label: show `<CircularProgress size={20} />` when `isPending`, otherwise `isEditing ? 'Update' : 'Create'`

---

## 3. Query Pattern

```tsx
const { data, isLoading, error } = useQuery<ItemType[]>({
  queryKey: ['resource', scopeId],
  queryFn: async () => {
    const { data } = await apiClient.get(`/admin/resource/${scopeId}`);
    return data;
  },
});

// Always pass through QueryState before rendering the main UI:
const queryState = QueryState({ isLoading, error, errorMessage: 'Failed to load X' });
if (queryState) return queryState;
```

**Rules:**
- Always call `QueryState` and early-return before rendering data-dependent UI
- Use `enabled: !!paramId` when the query depends on a route param that may be undefined on first render

---

## 4. Query Key Conventions

Always use these exact keys — never invent variants:

| Key | Covers |
|-----|--------|
| `['topics']` | all topics list |
| `['topic', topicId]` | single topic detail (fetched from the list, filtered client-side) |
| `['type-the-answer-items', topicId]` | Type the Answer items for a topic |
| `['flashcard-items', topicId]` | Flashcard items for a topic |
| `['fill-in-blank-items', topicId]` | Fill in Blank items for a topic |
| `['admin-dictionary-collections']` | all predefined collections |
| `['admin-collection-words', collectionId]` | words in a specific collection |
| `['admins']` | admin user list |

**Double-invalidation rule**: when adding, editing, or deleting a word inside a collection, always invalidate **both**:
```ts
queryClient.invalidateQueries({ queryKey: ['admin-collection-words', collectionId] }); // word list
queryClient.invalidateQueries({ queryKey: ['admin-dictionary-collections'] });          // word count chip
```

Similarly, when toggling exercise types on a topic:
```ts
queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
queryClient.invalidateQueries({ queryKey: ['topics'] });
```
