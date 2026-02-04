/**
 * ClearPress AI - Project Form Schemas
 * Zod validation schemas for project forms
 */

import { z } from 'zod';

/**
 * Schema for creating/editing a project
 */
export const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'プロジェクト名は必須です')
    .max(200, 'プロジェクト名は200文字以内で入力してください'),
  client_id: z
    .string()
    .min(1, 'クライアントを選択してください'),
  brief: z
    .string()
    .min(1, 'ブリーフは必須です')
    .max(5000, 'ブリーフは5000文字以内で入力してください'),
  urgency: z
    .enum(['standard', 'priority', 'urgent', 'crisis'], {
      message: '緊急度を選択してください',
    }),
  target_date: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

/**
 * Schema for updating project status
 */
export const projectStatusSchema = z.object({
  status: z.enum([
    'requested',
    'in_progress',
    'in_review',
    'approved',
    'completed',
    'archived',
  ]),
});

export type ProjectStatusData = z.infer<typeof projectStatusSchema>;

/**
 * Valid status transitions
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ['in_progress'],
  in_progress: ['in_review'],
  in_review: ['approved', 'in_progress'], // Can go back to in_progress for revisions
  approved: ['completed'],
  completed: ['archived'],
  archived: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Schema for client project request form (Client Portal)
 * Simplified version without client selector (auto-filled from user's client)
 */
export const clientRequestFormSchema = z.object({
  name: z
    .string()
    .min(1, 'リクエスト名は必須です')
    .max(200, 'リクエスト名は200文字以内で入力してください'),
  brief: z
    .string()
    .min(10, '概要は10文字以上で入力してください')
    .max(5000, '概要は5000文字以内で入力してください'),
  urgency: z
    .enum(['standard', 'priority', 'urgent', 'crisis'], {
      message: '緊急度を選択してください',
    }),
  target_date: z
    .string()
    .optional()
    .or(z.literal('')),
  content_type_hint: z
    .enum([
      'press_release',
      'blog_post',
      'social_media',
      'internal_memo',
      'faq',
      'executive_statement',
    ])
    .optional(),
});

export type ClientRequestFormData = z.infer<typeof clientRequestFormSchema>;
