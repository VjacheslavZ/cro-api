import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DictionaryWord,
  DictionaryCollection,
  TranslationSuggestion,
  PaginatedResponse,
  DictionaryPracticeSessionResponse,
  FinishDictionaryPracticeResponse,
} from '@cro/shared';

import { apiClient } from './client';

// --- Words ---

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

export function useDeleteWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wordId: string) => {
      await apiClient.delete(`/dictionary/words/${wordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-words'] });
    },
  });
}

export function useAssignCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { wordId: string; collectionId: string | null }) => {
      const { data } = await apiClient.patch(`/dictionary/words/${params.wordId}/collection`, {
        collectionId: params.collectionId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-words'] });
    },
  });
}

export function useBatchAssignCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { wordIds: string[]; collectionId: string | null }) => {
      await apiClient.patch('/dictionary/words/batch', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-words'] });
    },
  });
}

// --- Suggestions ---

export function useTranslationSuggestions(word: string) {
  return useQuery<TranslationSuggestion[]>({
    queryKey: ['dictionary-suggestions', word],
    queryFn: async () => {
      const { data } = await apiClient.get('/dictionary/suggestions', {
        params: { word },
      });
      return data;
    },
    enabled: word.length >= 2,
  });
}

// --- Collections ---

export function useDictionaryCollections() {
  return useQuery<DictionaryCollection[]>({
    queryKey: ['dictionary-collections'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dictionary/collections');
      return data;
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description?: string }) => {
      const { data } = await apiClient.post('/dictionary/collections', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-collections'] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; name?: string; description?: string }) => {
      const { id, ...body } = params;
      const { data } = await apiClient.patch(`/dictionary/collections/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/dictionary/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-collections'] });
    },
  });
}

// --- Practice ---

export function useStartDictionaryPractice() {
  return useMutation({
    mutationFn: async (params: { collectionId?: string; count?: number }) => {
      const { data } = await apiClient.post<DictionaryPracticeSessionResponse>(
        '/dictionary/practice/sessions',
        params,
      );
      return data;
    },
  });
}

export function useFinishDictionaryPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      answers: { wordId: string; givenAnswer: string; isCorrect: boolean }[];
    }) => {
      const { data } = await apiClient.post<FinishDictionaryPracticeResponse>(
        `/dictionary/practice/sessions/${params.sessionId}/finish`,
        { answers: params.answers },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary-words'] });
    },
  });
}
