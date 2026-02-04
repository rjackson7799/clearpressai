/**
 * ClearPress AI - Settings Service
 * API functions for organization and user settings management
 */

import { supabase } from './supabase';
import type { OrganizationSettings, UserPreferences } from '@/types';

// ===== Organization Settings =====

export interface OrganizationSettingsData extends OrganizationSettings {
  timezone?: string;
  business_hours?: {
    start: string;
    end: string;
  };
  email_footer?: string;
}

/**
 * Fetch organization settings
 */
export async function fetchOrganizationSettings(
  organizationId: string
): Promise<OrganizationSettingsData> {
  const { data, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching organization settings:', error);
    throw new Error('組織設定の取得に失敗しました');
  }

  return (data?.settings as OrganizationSettingsData) || {};
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: Partial<OrganizationSettingsData>
): Promise<void> {
  // Get current settings
  const currentSettings = await fetchOrganizationSettings(organizationId);

  // Merge with new settings
  const mergedSettings = {
    ...currentSettings,
    ...settings,
  };

  const { error } = await supabase
    .from('organizations')
    .update({
      settings: mergedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error updating organization settings:', error);
    throw new Error('組織設定の更新に失敗しました');
  }
}

/**
 * Update organization name
 */
export async function updateOrganizationName(
  organizationId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error updating organization name:', error);
    throw new Error('組織名の更新に失敗しました');
  }
}

// ===== User Notification Preferences =====

export interface NotificationPreferences {
  email_project_assigned?: boolean;
  email_content_submitted?: boolean;
  email_feedback_received?: boolean;
  email_content_approved?: boolean;
  email_deadline_reminder?: boolean;
  email_digest?: 'none' | 'daily' | 'weekly';
  in_app_all?: boolean;
  push_enabled?: boolean;
}

export interface ExtendedUserPreferences extends UserPreferences {
  notifications?: NotificationPreferences;
}

/**
 * Fetch user preferences
 */
export async function fetchUserPreferences(
  userId: string
): Promise<ExtendedUserPreferences> {
  const { data, error } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user preferences:', error);
    throw new Error('ユーザー設定の取得に失敗しました');
  }

  return (data?.preferences as ExtendedUserPreferences) || {
    language: 'ja',
    theme: 'system',
    notifications_email: true,
    notifications_in_app: true,
  };
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<ExtendedUserPreferences>
): Promise<void> {
  // Get current preferences
  const currentPrefs = await fetchUserPreferences(userId);

  // Merge with new preferences
  const mergedPrefs = {
    ...currentPrefs,
    ...preferences,
    // Deep merge notifications
    notifications: {
      ...(currentPrefs.notifications || {}),
      ...(preferences.notifications || {}),
    },
  };

  const { error } = await supabase
    .from('users')
    .update({
      preferences: mergedPrefs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('ユーザー設定の更新に失敗しました');
  }
}

// ===== Password Management =====

/**
 * Update user password
 * Uses Supabase Auth API
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Error updating password:', error);
    throw new Error('パスワードの更新に失敗しました');
  }
}

// ===== Activity Feed =====

export interface ActivityItem {
  id: string;
  type: 'project_created' | 'content_submitted' | 'content_approved' | 'comment_added' | 'user_joined';
  title: string;
  description?: string;
  user_id?: string;
  user_name?: string;
  project_id?: string;
  project_name?: string;
  content_id?: string;
  content_title?: string;
  created_at: string;
}

/**
 * Fetch recent activity for organization
 */
export async function fetchRecentActivity(
  organizationId: string,
  limit: number = 10
): Promise<ActivityItem[]> {
  // Fetch from notifications table as activity proxy
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      body,
      metadata,
      created_at,
      user:users!notifications_user_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity:', error);
    // Return empty array on error for graceful degradation
    return [];
  }

  // Transform notifications to activity items
  return (notifications || []).map((n) => ({
    id: n.id,
    type: mapNotificationTypeToActivity(n.type),
    title: n.title,
    description: n.body,
    user_name: (n.user as { name?: string })?.name,
    project_id: (n.metadata as { project_id?: string })?.project_id,
    project_name: (n.metadata as { project_name?: string })?.project_name,
    content_id: (n.metadata as { content_id?: string })?.content_id,
    content_title: (n.metadata as { content_title?: string })?.content_title,
    created_at: n.created_at,
  }));
}

function mapNotificationTypeToActivity(
  notificationType: string
): ActivityItem['type'] {
  const mapping: Record<string, ActivityItem['type']> = {
    project_request: 'project_created',
    content_submitted: 'content_submitted',
    content_approved: 'content_approved',
    comment_added: 'comment_added',
  };
  return mapping[notificationType] || 'project_created';
}

// ===== Approval Rate Calculation =====

/**
 * Calculate approval rate for organization
 * Returns percentage of first-time approvals (no revisions)
 */
export async function calculateApprovalRate(
  organizationId: string
): Promise<number> {
  // Get all content items for the organization
  const { data: contentItems, error: contentError } = await supabase
    .from('content_items')
    .select(`
      id,
      project:projects!inner(organization_id)
    `)
    .eq('projects.organization_id', organizationId);

  if (contentError || !contentItems?.length) {
    return 0;
  }

  const contentIds = contentItems.map((c) => c.id);

  // Get approval counts per content item
  const { data: approvals, error: approvalError } = await supabase
    .from('approvals')
    .select('content_item_id, status')
    .in('content_item_id', contentIds);

  if (approvalError || !approvals?.length) {
    return 0;
  }

  // Group by content item
  const approvalsByContent: Record<string, { approved: number; rejected: number }> = {};
  approvals.forEach((a) => {
    if (!approvalsByContent[a.content_item_id]) {
      approvalsByContent[a.content_item_id] = { approved: 0, rejected: 0 };
    }
    if (a.status === 'approved') {
      approvalsByContent[a.content_item_id].approved++;
    } else if (a.status === 'changes_requested') {
      approvalsByContent[a.content_item_id].rejected++;
    }
  });

  // Calculate first-time approval rate
  const contentWithApprovals = Object.values(approvalsByContent);
  if (contentWithApprovals.length === 0) return 0;

  const firstTimeApprovals = contentWithApprovals.filter(
    (c) => c.approved > 0 && c.rejected === 0
  ).length;

  return Math.round((firstTimeApprovals / contentWithApprovals.length) * 100);
}
