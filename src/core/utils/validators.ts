/**
 * Validators
 * College Knowledge Vault
 *
 * Zod schemas for form validation.
 * Phase 1: Schema definitions only.
 */

import { z } from 'zod';
import { VALIDATION, ERRORS } from '../constants/appConstants';

/** Entry title validation schema */
export const titleSchema = z
  .string()
  .min(
    VALIDATION.TITLE_MIN_LENGTH,
    ERRORS.VALIDATION_MIN_LENGTH.replace('{min}', String(VALIDATION.TITLE_MIN_LENGTH)),
  )
  .max(
    VALIDATION.TITLE_MAX_LENGTH,
    ERRORS.VALIDATION_MAX_LENGTH.replace('{max}', String(VALIDATION.TITLE_MAX_LENGTH)),
  );

/** Entry description validation schema */
export const descriptionSchema = z
  .string()
  .min(
    VALIDATION.DESCRIPTION_MIN_LENGTH,
    ERRORS.VALIDATION_MIN_LENGTH.replace('{min}', String(VALIDATION.DESCRIPTION_MIN_LENGTH)),
  )
  .max(
    VALIDATION.DESCRIPTION_MAX_LENGTH,
    ERRORS.VALIDATION_MAX_LENGTH.replace('{max}', String(VALIDATION.DESCRIPTION_MAX_LENGTH)),
  );

/** Tags validation schema */
export const tagsSchema = z
  .array(z.string().min(1))
  .min(1, 'At least one tag is required')
  .max(VALIDATION.TAG_MAX_COUNT, `Maximum ${VALIDATION.TAG_MAX_COUNT} tags allowed`);

/** Viva question schema */
export const vivaQuestionSchema = z.object({
  question: z
    .string()
    .min(
      VALIDATION.VIVA_QUESTION_MIN_LENGTH,
      ERRORS.VALIDATION_MIN_LENGTH.replace('{min}', String(VALIDATION.VIVA_QUESTION_MIN_LENGTH)),
    ),
  answer: z
    .string()
    .max(VALIDATION.VIVA_ANSWER_MAX_LENGTH)
    .nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  frequency: z.enum(['rare', 'common', 'very_common']),
});

/** Complete entry submission schema */
export const createEntrySchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  type: z.enum(['project', 'viva', 'mistake', 'resource']),
  tags: tagsSchema,
  subject: z.string().min(1, ERRORS.VALIDATION_REQUIRED),
  semester: z.number().int().min(1).max(10),
  vivaQuestions: z.array(vivaQuestionSchema).optional(),
});

/** Flag report schema */
export const flagSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'duplicate', 'inaccurate', 'other']),
  description: z.string().max(500).nullable(),
});

export type CreateEntryFormData = z.infer<typeof createEntrySchema>;
export type VivaQuestionFormData = z.infer<typeof vivaQuestionSchema>;
export type FlagFormData = z.infer<typeof flagSchema>;
