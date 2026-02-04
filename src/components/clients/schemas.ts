/**
 * ClearPress AI - Client Form Schemas
 * Zod validation schemas for client forms
 */

import { z } from 'zod';

/**
 * Schema for creating/editing a client
 */
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, 'クライアント名は必須です')
    .max(100, 'クライアント名は100文字以内で入力してください'),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  logo_url: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  industryIds: z
    .array(z.string())
    .min(1, '少なくとも1つの業界を選択してください'),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

/**
 * Schema for client settings
 */
export const clientSettingsSchema = z.object({
  default_urgency: z
    .enum(['standard', 'priority', 'urgent', 'crisis'])
    .optional(),
  require_approval: z.boolean().optional(),
});

export type ClientSettingsData = z.infer<typeof clientSettingsSchema>;

/**
 * Schema for style profile
 */
export const styleProfileSchema = z.object({
  tone: z
    .string()
    .max(200, 'トーンは200文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  formality: z.enum(['low', 'medium', 'high']).optional(),
  key_messages: z
    .array(z.string().max(200, 'メッセージは200文字以内'))
    .max(10, '最大10件まで')
    .optional(),
  avoid_phrases: z
    .array(z.string().max(100, 'フレーズは100文字以内'))
    .max(20, '最大20件まで')
    .optional(),
  boilerplate: z
    .string()
    .max(2000, 'ボイラープレートは2000文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

export type StyleProfileData = z.infer<typeof styleProfileSchema>;
