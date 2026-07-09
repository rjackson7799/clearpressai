/**
 * Bilingual labels + badge variants for the internal feedback tracker's
 * `type` and `status` enums. Shared by the submit form, the filter tabs, and
 * the item cards so a raw enum value ("in_progress") never leaks to the user.
 * Unknown values degrade gracefully (raw value / dash) rather than throwing.
 */
import type { InternalFeedbackType, InternalFeedbackStatus } from '@/types/domain';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
type Label = { ja: string; en: string };

export const INTERNAL_FEEDBACK_TYPES = [
  'bug',
  'feature',
  'improvement',
] as const satisfies readonly InternalFeedbackType[];

export const INTERNAL_FEEDBACK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
] as const satisfies readonly InternalFeedbackStatus[];

export const INTERNAL_FEEDBACK_TYPE_LABELS: Record<InternalFeedbackType, Label> = {
  bug: { ja: '不具合', en: 'Bug' },
  feature: { ja: '機能要望', en: 'Feature' },
  improvement: { ja: '改善', en: 'Improvement' },
};

export const INTERNAL_FEEDBACK_STATUS_LABELS: Record<InternalFeedbackStatus, Label> = {
  pending: { ja: '未対応', en: 'Pending' },
  in_progress: { ja: '対応中', en: 'In Progress' },
  completed: { ja: '完了', en: 'Completed' },
};

export const INTERNAL_FEEDBACK_TYPE_VARIANT: Record<InternalFeedbackType, BadgeVariant> = {
  bug: 'destructive',
  feature: 'default',
  improvement: 'secondary',
};

export const INTERNAL_FEEDBACK_STATUS_VARIANT: Record<InternalFeedbackStatus, BadgeVariant> = {
  pending: 'outline',
  in_progress: 'secondary',
  completed: 'default',
};

export function feedbackTypeLabel(type: string | null | undefined): Label {
  if (!type) return { ja: '—', en: '—' };
  return INTERNAL_FEEDBACK_TYPE_LABELS[type as InternalFeedbackType] ?? {
    ja: type,
    en: type,
  };
}

export function feedbackStatusLabel(status: string | null | undefined): Label {
  if (!status) return { ja: '—', en: '—' };
  return INTERNAL_FEEDBACK_STATUS_LABELS[status as InternalFeedbackStatus] ?? {
    ja: status,
    en: status,
  };
}

export function feedbackTypeVariant(type: string): BadgeVariant {
  return INTERNAL_FEEDBACK_TYPE_VARIANT[type as InternalFeedbackType] ?? 'outline';
}

export function feedbackStatusVariant(status: string): BadgeVariant {
  return (
    INTERNAL_FEEDBACK_STATUS_VARIANT[status as InternalFeedbackStatus] ?? 'outline'
  );
}
