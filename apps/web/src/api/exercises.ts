import { useMutation } from '@tanstack/react-query';
import type { ExerciseItem, FinishSessionResponse } from '@cro/shared';

import { apiClient } from './client';

export interface CreateSessionResponse {
  cycleExhausted: boolean;
  session: {
    id: string;
    exerciseType: string;
    topicId: string;
    status: string;
    totalQuestions: number;
    rulesHtmlHr: string | null;
    rulesHtmlRu: string | null;
    rulesHtmlUk: string | null;
    rulesHtmlEn: string | null;
    items: ExerciseItem[];
  } | null;
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (params: { topicId: string; exerciseType: string }) => {
      const { data } = await apiClient.post<CreateSessionResponse>('/exercises/sessions', params);
      return data;
    },
  });
}

export function useFinishSession() {
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      answers: { itemId: string; givenAnswer: string; isCorrect: boolean }[];
    }) => {
      const { data } = await apiClient.post<FinishSessionResponse>(
        `/exercises/sessions/${params.sessionId}/finish`,
        { answers: params.answers },
      );
      return data;
    },
  });
}

export function useResetCycle() {
  return useMutation({
    mutationFn: async (params: { topicId: string; exerciseType: string }) => {
      const { data } = await apiClient.post('/exercises/cycle-reset', params);
      return data;
    },
  });
}
