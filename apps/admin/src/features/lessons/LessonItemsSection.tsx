import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Lesson, LessonItem } from '@cro/shared';
import { LessonItemType } from '@cro/shared';

import { apiClient } from '../../api/client';

interface TopicOption {
  id: string;
  nameEn: string;
}

interface CollectionOption {
  id: string;
  nameEn: string;
}

interface LessonItemsSectionProps {
  lesson: Lesson;
}

interface LessonItemRowProps {
  item: LessonItem;
  onRemove: (itemId: string) => void;
  isRemoving: boolean;
}

function LessonItemRow({ item, onRemove, isRemoving }: LessonItemRowProps) {
  const isTopic = item.itemType === LessonItemType.EXERCISE_TOPIC;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Chip
        label={isTopic ? 'Topic' : 'Collection'}
        size="small"
        color={isTopic ? 'primary' : 'secondary'}
        variant="outlined"
      />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {item.itemName}
      </Typography>
      <IconButton
        size="small"
        color="error"
        onClick={() => onRemove(item.id)}
        disabled={isRemoving}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

interface AddLessonItemRowProps {
  label: string;
  options: { id: string; nameEn: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  isAdding: boolean;
}

function AddLessonItemRow({
  label,
  options,
  selectedId,
  onSelect,
  onAdd,
  addLabel,
  isAdding,
}: AddLessonItemRowProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-end">
      <FormControl sx={{ minWidth: 240 }} size="small">
        <InputLabel>{label}</InputLabel>
        <Select value={selectedId} label={label} onChange={(e) => onSelect(e.target.value)}>
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.nameEn}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        disabled={!selectedId || isAdding}
        onClick={onAdd}
      >
        {addLabel}
      </Button>
    </Stack>
  );
}

export function LessonItemsSection({ lesson }: LessonItemsSectionProps) {
  const queryClient = useQueryClient();
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  const { data: topics } = useQuery<TopicOption[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/topics');
      return data;
    },
  });

  const { data: collections } = useQuery<CollectionOption[]>({
    queryKey: ['dictionary-collections'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/dictionary-collections');
      return data;
    },
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/lessons');
      return data;
    },
  });

  const freshLesson = lessons?.find((l) => l.id === lesson.id);
  const currentItems: LessonItem[] = freshLesson?.items ?? lesson.items ?? [];

  const addedTopicIds = new Set(
    currentItems.filter((i) => i.itemType === LessonItemType.EXERCISE_TOPIC).map((i) => i.itemId),
  );
  const addedCollectionIds = new Set(
    currentItems
      .filter((i) => i.itemType === LessonItemType.DICTIONARY_COLLECTION)
      .map((i) => i.itemId),
  );
  const availableTopics = topics?.filter((t) => !addedTopicIds.has(t.id)) ?? [];
  const availableCollections = collections?.filter((c) => !addedCollectionIds.has(c.id)) ?? [];

  const addItemMutation = useMutation({
    mutationFn: async (params: { itemType: LessonItemType; itemId: string }) => {
      await apiClient.post(`/admin/lessons/${lesson.id}/items`, {
        ...params,
        sortOrder: currentItems.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setSelectedTopicId('');
      setSelectedCollectionId('');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/admin/lessons/${lesson.id}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });

  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h6" gutterBottom>
        Lesson Items
      </Typography>

      {currentItems.length > 0 ? (
        <Stack spacing={1} sx={{ mb: 3 }}>
          {currentItems.map((item) => (
            <LessonItemRow
              key={item.id}
              item={item}
              onRemove={(itemId) => removeItemMutation.mutate(itemId)}
              isRemoving={removeItemMutation.isPending}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No items yet. Add exercise topics or dictionary collections below.
        </Typography>
      )}

      <AddLessonItemRow
        label="Add Exercise Topic"
        options={availableTopics}
        selectedId={selectedTopicId}
        onSelect={setSelectedTopicId}
        onAdd={() =>
          addItemMutation.mutate({
            itemType: LessonItemType.EXERCISE_TOPIC,
            itemId: selectedTopicId,
          })
        }
        addLabel="Add Topic"
        isAdding={addItemMutation.isPending}
      />

      <Box sx={{ mt: 2 }}>
        <AddLessonItemRow
          label="Add Dictionary Collection"
          options={availableCollections}
          selectedId={selectedCollectionId}
          onSelect={setSelectedCollectionId}
          onAdd={() =>
            addItemMutation.mutate({
              itemType: LessonItemType.DICTIONARY_COLLECTION,
              itemId: selectedCollectionId,
            })
          }
          addLabel="Add Collection"
          isAdding={addItemMutation.isPending}
        />
      </Box>
    </Box>
  );
}
