import { z } from 'zod';
import type { Lesson } from '@cro/shared';

export const lessonSchema = z.object({
  titleHr: z.string().min(1, 'Title (HR) is required'),
  titleRu: z.string().min(1, 'Title (RU) is required'),
  titleUk: z.string().min(1, 'Title (UK) is required'),
  titleEn: z.string().min(1, 'Title (EN) is required'),
  descriptionHr: z.string().optional(),
  descriptionRu: z.string().optional(),
  descriptionUk: z.string().optional(),
  descriptionEn: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be >= 0'),
  isActive: z.boolean(),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export function getLessonFormDefaultValues(lesson: Lesson | null): LessonFormData {
  if (lesson) {
    return {
      titleHr: lesson.titleHr,
      titleRu: lesson.titleRu,
      titleUk: lesson.titleUk,
      titleEn: lesson.titleEn,
      descriptionHr: lesson.descriptionHr ?? '',
      descriptionRu: lesson.descriptionRu ?? '',
      descriptionUk: lesson.descriptionUk ?? '',
      descriptionEn: lesson.descriptionEn ?? '',
      sortOrder: lesson.sortOrder,
      isActive: lesson.isActive,
    };
  }

  return {
    titleHr: '',
    titleRu: '',
    titleUk: '',
    titleEn: '',
    descriptionHr: '',
    descriptionRu: '',
    descriptionUk: '',
    descriptionEn: '',
    sortOrder: 0,
    isActive: true,
  };
}
