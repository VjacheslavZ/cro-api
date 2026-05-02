/**
 * @module ExercisePage
 * @description Admin page for managing exercise items within a single topic. Tabbed layout with
 * one tab per exercise type (Type the Answer, Flashcards, Fill in Blank). Toggle switches at the
 * top enable/disable each exercise type for the topic via PATCH /admin/topics/:id/exercise-types,
 * invalidating both ['topic', topicId] and ['topics']. Topic data is fetched from the full topic
 * list (GET /admin/topics) and filtered client-side by topicId.
 * @usedBy AdminRouter (/topics/:topicId/items)
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Tab, Tabs, Typography, Button, Switch, FormControlLabel, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExerciseType } from '@cro/shared';

import { apiClient } from '../../api/client';
import { QueryState } from '../../shared/components/QueryState';
import { TypeTheAnswer } from './TypeTheAnswer';
import { Flashcards } from './Flashcards';
import { FillInBlankTab } from './FillInBlank';
import { BuildSentenceTab } from './BuildSentence';

interface TopicDetail {
  id: string;
  nameHr: string;
  nameEn: string;
  exerciseTypes: string[];
}

const EXERCISE_TABS = [
  { type: ExerciseType.TYPE_THE_ANSWER, label: 'Type the Answer' },
  { type: ExerciseType.FLASHCARDS, label: 'Flashcards' },
  { type: ExerciseType.FILL_IN_BLANK, label: 'Fill in Blank' },
  { type: ExerciseType.BUILD_SENTENCE, label: 'Build a Sentence' },
];

/**
 * Renders the topic exercise management page with type-enable toggles and per-type item tabs.
 */
export function ExercisePage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const {
    data: topic,
    isLoading,
    error,
  } = useQuery<TopicDetail>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/topics`);
      return data.find((t: TopicDetail) => t.id === topicId);
    },
    enabled: !!topicId,
  });

  const toggleTypeMutation = useMutation({
    mutationFn: async ({ exerciseType, enabled }: { exerciseType: string; enabled: boolean }) => {
      console.log('exerciseType', exerciseType);
      await apiClient.patch(`/admin/topics/${topicId}/exercise-types`, {
        configs: [{ exerciseType, enabled }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  const queryState = QueryState({
    isLoading,
    error: error || !topic,
    errorMessage: 'Failed to load topic',
  });
  if (queryState) return queryState;

  const currentTab = EXERCISE_TABS[tab];

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/topics')} sx={{ mb: 2 }}>
        Back to Topics
      </Button>

      <Typography variant="h5" gutterBottom>
        {topic?.nameEn} — Exercises
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {EXERCISE_TABS.map((et) => (
          <FormControlLabel
            key={et.type}
            control={
              <Switch
                checked={topic?.exerciseTypes.includes(et.type)}
                onChange={(_, checked) =>
                  toggleTypeMutation.mutate({ exerciseType: et.type, enabled: checked })
                }
                disabled={toggleTypeMutation.isPending}
                size="small"
              />
            }
            label={et.label}
          />
        ))}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {EXERCISE_TABS.map((et) => (
            <Tab key={et.type} label={et.label} />
          ))}
        </Tabs>
      </Box>

      {currentTab.type === ExerciseType.TYPE_THE_ANSWER && <TypeTheAnswer topicId={topicId!} />}
      {currentTab.type === ExerciseType.FLASHCARDS && <Flashcards topicId={topicId!} />}
      {currentTab.type === ExerciseType.FILL_IN_BLANK && <FillInBlankTab topicId={topicId!} />}
      {currentTab.type === ExerciseType.BUILD_SENTENCE && <BuildSentenceTab topicId={topicId!} />}
    </Box>
  );
}
