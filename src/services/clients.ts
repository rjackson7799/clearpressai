/**
 * ClearPress AI - Client Service
 * CRUD operations for clients, industries, and client users
 */

import { supabase } from './supabase';
import type { Client, Industry, User, StyleProfile, PaginatedResponse } from '@/types';
import type { Database } from '@/types/database';

// Database row types
type DbClient = Database['public']['Tables']['clients']['Row'];
type DbIndustry = Database['public']['Tables']['industries']['Row'];
type DbUser = Database['public']['Tables']['users']['Row'];

// ===== Type Converters =====

function dbClientToClient(row: DbClient): Client {
  return {
    ...row,
    description: row.description ?? undefined,
    logo_url: row.logo_url ?? undefined,
    settings: (row.settings as Client['settings']) ?? {},
    style_profile: (row.style_profile as StyleProfile) ?? {},
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

function dbIndustryToIndustry(row: DbIndustry): Industry {
  return {
    ...row,
    is_active: row.is_active ?? true,
    icon: row.icon ?? undefined,
    config: (row.config as Industry['config']) ?? {},
    compliance_rules: row.compliance_rules ?? undefined,
    prompts: (row.prompts as Record<string, string>) ?? undefined,
  };
}

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

// ===== Client Filters =====

export interface ClientFilters {
  search?: string;
  industry_id?: string;
  page?: number;
  per_page?: number;
}

// ===== Client CRUD =====

/**
 * Fetch all clients for an organization with optional filters
 */
export async function fetchClients(
  organizationId: string,
  filters?: ClientFilters
): Promise<PaginatedResponse<Client>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('clients')
    .select(`
      *,
      client_industries(industry:industries(*)),
      projects(count),
      client_users(count)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  // Apply search filter
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('クライアントの取得に失敗しました');
  }

  return {
    data: (data ?? []).map((row) => dbClientToClient(row as unknown as DbClient)),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Fetch a single client by ID
 */
export async function fetchClient(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_industries(industry:industries(*)),
      projects(count),
      client_users(user:users(*))
    `)
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    throw new Error('クライアントの取得に失敗しました');
  }

  return data ? dbClientToClient(data as unknown as DbClient) : null;
}

/**
 * Create a new client
 */
export async function createClient(
  organizationId: string,
  data: {
    name: string;
    description?: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    style_profile?: StyleProfile;
  }
): Promise<Client> {
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      organization_id: organizationId,
      name: data.name,
      description: data.description ?? null,
      logo_url: data.logo_url ?? null,
      settings: (data.settings ?? {}) as Database['public']['Tables']['clients']['Insert']['settings'],
      style_profile: (data.style_profile ?? {}) as Database['public']['Tables']['clients']['Insert']['style_profile'],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('クライアントの作成に失敗しました');
  }

  return dbClientToClient(client);
}

/**
 * Update an existing client
 */
export async function updateClient(
  clientId: string,
  data: {
    name?: string;
    description?: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    style_profile?: StyleProfile;
  }
): Promise<Client> {
  const updateData: Database['public']['Tables']['clients']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
  if (data.settings !== undefined) updateData.settings = data.settings as Database['public']['Tables']['clients']['Update']['settings'];
  if (data.style_profile !== undefined) updateData.style_profile = data.style_profile as Database['public']['Tables']['clients']['Update']['style_profile'];

  const { data: client, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('クライアントの更新に失敗しました');
  }

  return dbClientToClient(client);
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error('クライアントの削除に失敗しました');
  }
}

// ===== Client Industries =====

/**
 * Fetch industries assigned to a client
 */
export async function fetchClientIndustries(clientId: string): Promise<Industry[]> {
  const { data, error } = await supabase
    .from('client_industries')
    .select('industry:industries(*)')
    .eq('client_id', clientId);

  if (error) {
    console.error('Error fetching client industries:', error);
    throw new Error('業界情報の取得に失敗しました');
  }

  return (data ?? [])
    .map((item) => item.industry)
    .filter((ind): ind is DbIndustry => ind !== null)
    .map(dbIndustryToIndustry);
}

/**
 * Update industries for a client (replace all)
 */
export async function updateClientIndustries(
  clientId: string,
  industryIds: string[]
): Promise<void> {
  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from('client_industries')
    .delete()
    .eq('client_id', clientId);

  if (deleteError) {
    console.error('Error removing client industries:', deleteError);
    throw new Error('業界の更新に失敗しました');
  }

  // Insert new assignments
  if (industryIds.length > 0) {
    const { error: insertError } = await supabase
      .from('client_industries')
      .insert(
        industryIds.map((industryId) => ({
          client_id: clientId,
          industry_id: industryId,
        }))
      );

    if (insertError) {
      console.error('Error adding client industries:', insertError);
      throw new Error('業界の更新に失敗しました');
    }
  }
}

// ===== Client Users =====

/**
 * Fetch users assigned to a client
 */
export async function fetchClientUsers(clientId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('client_users')
    .select('user:users(*)')
    .eq('client_id', clientId);

  if (error) {
    console.error('Error fetching client users:', error);
    throw new Error('クライアントユーザーの取得に失敗しました');
  }

  return (data ?? [])
    .map((item) => item.user)
    .filter((u): u is DbUser => u !== null)
    .map(dbUserToUser);
}

/**
 * Add a user to a client
 */
export async function addClientUser(
  clientId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('client_users')
    .insert({
      client_id: clientId,
      user_id: userId,
    });

  if (error) {
    console.error('Error adding client user:', error);
    throw new Error('ユーザーの追加に失敗しました');
  }
}

/**
 * Remove a user from a client
 */
export async function removeClientUser(
  clientId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('client_users')
    .delete()
    .eq('client_id', clientId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing client user:', error);
    throw new Error('ユーザーの削除に失敗しました');
  }
}

/**
 * Fetch all client_user role users in the organization
 * Used for adding users to clients
 */
export async function fetchAvailableClientUsers(
  organizationId: string
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'client_user')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching available client users:', error);
    throw new Error('ユーザーの取得に失敗しました');
  }

  return (data ?? []).map(dbUserToUser);
}

/**
 * Fetch the client ID for a client_user
 * Returns null if user is not assigned to any client
 */
export async function fetchClientIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching client ID for user:', error);
    return null;
  }

  return data?.client_id ?? null;
}

/**
 * Fetch all clients assigned to a user (client_user can belong to multiple clients)
 */
export async function fetchClientsForUser(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('client_users')
    .select('client:clients(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching clients for user:', error);
    throw new Error('クライアント情報の取得に失敗しました');
  }

  return (data ?? [])
    .map((item) => item.client)
    .filter((c): c is DbClient => c !== null)
    .map(dbClientToClient);
}

// ===== Email-to-Client Lookup =====

/**
 * Find a client by user email address.
 * Used for auto-detecting client when creating projects from email.
 * Returns the client if the email belongs to a client_user assigned to that client.
 */
export async function findClientByUserEmail(
  email: string,
  organizationId: string
): Promise<Client | null> {
  // First, find the user by email in the organization
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('role', 'client_user')
    .maybeSingle();

  if (userError || !user) {
    return null;
  }

  // Now find the client this user is assigned to
  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select(`
      client:clients(*)
    `)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (clientUserError || !clientUser?.client) {
    return null;
  }

  const client = clientUser.client as DbClient;

  // Verify the client belongs to the same organization
  if (client.organization_id !== organizationId) {
    return null;
  }

  return dbClientToClient(client);
}
