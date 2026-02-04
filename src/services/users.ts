/**
 * ClearPress AI - Users Service
 * CRUD operations for organization users (PR team members)
 */

import { supabase } from './supabase';
import type { User, PaginatedResponse } from '@/types';
import type { Database } from '@/types/database';

type DbUser = Database['public']['Tables']['users']['Row'];

// ===== Type Converter =====

function dbUserToUser(row: DbUser): User {
  return {
    ...row,
    is_active: row.is_active ?? true,
    avatar_url: row.avatar_url ?? undefined,
    preferences: (row.preferences as unknown as User['preferences']) ?? { language: 'ja' },
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// ===== Filters Interface =====

export interface UserFilters {
  search?: string;
  role?: 'pr_admin' | 'pr_staff';
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

// ===== Fetch Users (paginated) =====

/**
 * Fetch all PR team users for an organization with optional filters
 * Excludes client_user role
 */
export async function fetchUsers(
  organizationId: string,
  filters?: UserFilters
): Promise<PaginatedResponse<User>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .in('role', ['pr_admin', 'pr_staff']) // Exclude client_user
    .order('name', { ascending: true });

  // Apply search filter (name or email)
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  // Apply role filter
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  // Apply status filter
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('チームメンバーの取得に失敗しました');
  }

  return {
    data: (data ?? []).map(dbUserToUser),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

// ===== Update User Status =====

/**
 * Toggle user active status (activate/deactivate)
 */
export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user status:', error);
    throw new Error('ユーザーステータスの更新に失敗しました');
  }

  return dbUserToUser(data);
}

// ===== Invite User Types =====

export interface InviteUserRequest {
  email: string;
  role: 'pr_admin' | 'pr_staff' | 'client_user';
  name?: string;
  client_id?: string; // Required for client_user role
}

export interface InviteUserResponse {
  success: boolean;
  user_id?: string;
  error?: {
    code: string;
    message: string;
  };
}

// Custom error class for invite errors with code
export class InviteError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'InviteError';
  }
}

// ===== Invite User =====

/**
 * Invite a new user to the organization via Edge Function.
 * Requires pr_admin role.
 */
export async function inviteUser(
  request: InviteUserRequest
): Promise<InviteUserResponse> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: request,
  });

  if (error) {
    console.error('Error invoking invite-user function:', error);
    throw new InviteError('NETWORK_ERROR', 'ネットワークエラーが発生しました');
  }

  const response = data as InviteUserResponse;

  // If the Edge Function returned an error, throw it
  if (!response.success && response.error) {
    throw new InviteError(response.error.code, response.error.message);
  }

  return response;
}

// ===== Notification Recipients =====

/**
 * Fetch PR Admin user IDs for an organization.
 * Used for sending notifications when clients submit project requests.
 */
export async function fetchPRAdminIds(organizationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', 'pr_admin')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching PR admin IDs:', error);
    return [];
  }

  return data?.map((u) => u.id) ?? [];
}

/**
 * Fetch all PR staff user IDs (admin + staff) for an organization.
 * Used for broader notification scenarios.
 */
export async function fetchPRStaffIds(organizationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', organizationId)
    .in('role', ['pr_admin', 'pr_staff'])
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching PR staff IDs:', error);
    return [];
  }

  return data?.map((u) => u.id) ?? [];
}
