import { useQuery } from '@tanstack/react-query';
import type { ExerciseTopic } from '@cro/shared';

import { apiClient } from './client';

export function useTopics() {
  return useQuery<ExerciseTopic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/content/topics');
      return data;
    },
  });
}
