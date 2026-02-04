/**
 * ClearPress AI - Profile Service
 * API functions for user profile management
 */

import { supabase } from './supabase';
import type { Database } from '@/types/database';

type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface ProfileUpdateData {
  name?: string;
  avatar_url?: string | null;
  preferences?: Record<string, unknown> | null;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<void> {
  const updates: UserUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
  if (data.preferences !== undefined) updates.preferences = data.preferences as unknown as UserUpdate['preferences'];

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }
}

/**
 * Update user preferences (partial update)
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<void> {
  // First get current preferences
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching user preferences:', fetchError);
    throw new Error('Failed to fetch user preferences');
  }

  // Merge with existing preferences
  const currentPrefs = (currentUser?.preferences as Record<string, unknown>) || {};
  const mergedPreferences = {
    ...currentPrefs,
    ...preferences,
  };

  const { error } = await supabase
    .from('users')
    .update({
      preferences: mergedPreferences as unknown as UserUpdate['preferences'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating preferences:', error);
    throw new Error('Failed to update preferences');
  }
}
