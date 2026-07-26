import { useState } from 'react';
import { Alert, Box, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lesson } from '@cro/shared';

import { apiClient } from '../../api/client';
import { LessonDetailsFields } from './LessonDetailsFields';
import { LessonItemsSection } from './LessonItemsSection';
import {
  getLessonFormDefaultValues,
  lessonSchema,
  type LessonFormData,
} from './lesson-form.schema';

interface CreateLessonFormProps {
  lesson: Lesson | null;
  onDone: () => void;
}

export function CreateLessonForm({ lesson, onDone }: CreateLessonFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lesson;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema) as never,
    defaultValues: getLessonFormDefaultValues(lesson),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      if (isEditing) {
        const { data: result } = await apiClient.patch(`/admin/lessons/${lesson.id}`, data);
        return result;
      }
      const { data: result } = await apiClient.post('/admin/lessons', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setSuccess(true);
      setError(null);
      if (!isEditing) reset();
      setTimeout(() => onDone(), 1500);
    },
    onError: (err: unknown) => {
      setSuccess(false);
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('An error occurred');
      }
    },
  });

  const onSubmit = (data: LessonFormData) => {
    setError(null);
    setSuccess(false);
    saveMutation.mutate(data);
  };

  return (
    <Paper sx={{ p: 3 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Lesson {isEditing ? 'updated' : 'created'} successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <LessonDetailsFields
          register={register}
          errors={errors}
          isActiveDefault={lesson?.isActive ?? true}
          isEditing={isEditing}
          isPending={saveMutation.isPending}
        />
      </Box>

      {isEditing && lesson && <LessonItemsSection lesson={lesson} />}
    </Paper>
  );
}
