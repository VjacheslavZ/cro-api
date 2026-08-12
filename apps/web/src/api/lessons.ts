import { useQuery } from '@tanstack/react-query';
import type { Lesson } from '@cro/shared';

import { apiClient } from './client';

export function useLessons() {
  return useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data } = await apiClient.get('/lessons');
      return data;
    },
  });
}
