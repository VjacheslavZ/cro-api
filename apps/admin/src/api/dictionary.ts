import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';

export interface AdminAiTranslation {
  translationRu: string;
  translationUk: string;
  translationEn: string;
}

export function useAdminAiTranslation(word: string) {
  return useQuery<AdminAiTranslation>({
    queryKey: ['admin-ai-translation', word],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/dictionary-collections/ai-translation', {
        params: { word },
      });
      return data;
    },
    enabled: word.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
