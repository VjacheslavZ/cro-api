import { z } from 'zod';

const wordSchema = z.object({
  wordHr: z.string().min(1),
  position: z.number().int().min(0),
  distractors: z.array(z.string()).default([]),
});

export const buildSentenceSchema = z.object({
  sentenceHr: z.string().min(1, 'Required'),
  translationRu: z.string().min(1, 'Required'),
  translationUk: z.string().min(1, 'Required'),
  translationEn: z.string().min(1, 'Required'),
  sortOrder: z.coerce.number().int().min(0),
  words: z.array(wordSchema).min(1, 'Add at least one word'),
});

export type BuildSentenceFormData = z.infer<typeof buildSentenceSchema>;

export interface BuildSentenceWord {
  id: string;
  wordHr: string;
  position: number;
  distractors: string[];
}

export interface BuildSentenceItemData {
  id: string;
  translationRu: string;
  translationUk: string;
  translationEn: string;
  sortOrder: number;
  words: BuildSentenceWord[];
}

export const defaultValues: BuildSentenceFormData = {
  sentenceHr: '',
  translationRu: '',
  translationUk: '',
  translationEn: '',
  sortOrder: 0,
  words: [],
};
