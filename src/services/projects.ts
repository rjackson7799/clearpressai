/**
 * ClearPress AI - Project Service
 * CRUD operations for projects
 */

import { supabase } from './supabase';
import type {
  Project,
  ProjectStatus,
  UrgencyLevel,
  ExpandedBrief,
  ProjectFilters,
  PaginatedResponse,
} from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbProject = Database['public']['Tables']['projects']['Row'];

// ===== Type Converters =====

function dbProjectToProject(row: DbProject): Project {
  return {
    ...row,
    status: (row.status ?? 'requested') as ProjectStatus,
    urgency: (row.urgency ?? 'standard') as UrgencyLevel,
    target_date: row.target_date ?? undefined,
    expanded_brief: (row.expanded_brief as unknown as ExpandedBrief) ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// ===== Project CRUD =====

/**
 * Fetch all projects for an organization with optional filters
 */
export async function fetchProjects(
  organizationId: string,
  filters?: ProjectFilters & { page?: number; per_page?: number }
): Promise<PaginatedResponse<Project>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url),
      created_by_user:users!projects_created_by_fkey(id, name, avatar_url),
      content_items(count)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.urgency && filters.urgency.length > 0) {
    query = query.in('urgency', filters.urgency);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.date_from) {
    query = query.gte('target_date', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('target_date', filters.date_to);
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('プロジェクトの取得に失敗しました');
  }

  return {
    data: (data ?? []).map((row) => dbProjectToProject(row as unknown as DbProject)),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Fetch projects for a specific client (used in Client Portal)
 */
export async function fetchProjectsByClient(
  clientId: string,
  filters?: { status?: ProjectStatus[]; page?: number; per_page?: number }
): Promise<PaginatedResponse<Project>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('projects')
    .select(`
      *,
      content_items(count)
    `, { count: 'exact' })
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching client projects:', error);
    throw new Error('プロジェクトの取得に失敗しました');
  }

  return {
    data: (data ?? []).map((row) => dbProjectToProject(row as unknown as DbProject)),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      created_by_user:users!projects_created_by_fkey(id, name, email, avatar_url),
      content_items(
        id,
        type,
        title,
        status,
        created_at,
        current_version_id
      )
    `)
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw new Error('プロジェクトの取得に失敗しました');
  }

  return data ? dbProjectToProject(data as unknown as DbProject) : null;
}

/**
 * Create a new project
 */
export async function createProject(
  organizationId: string,
  data: {
    client_id: string;
    name: string;
    brief: string;
    urgency?: UrgencyLevel;
    target_date?: string;
  },
  userId: string
): Promise<Project> {
  // Step 1: Insert the project and get just the id
  const { data: insertedProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      client_id: data.client_id,
      name: data.name,
      brief: data.brief,
      status: 'requested',
      urgency: data.urgency ?? 'standard',
      target_date: data.target_date,
      created_by: userId,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting project:', insertError);
    throw new Error('プロジェクトの作成に失敗しました');
  }

  // Step 2: Fetch the full project with relations
  const { data: project, error: selectError } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url)
    `)
    .eq('id', insertedProject.id)
    .single();

  if (selectError) {
    console.error('Error fetching created project:', selectError);
    // Return minimal data if select fails - project was created
    return {
      id: insertedProject.id,
      organization_id: organizationId,
      client_id: data.client_id,
      name: data.name,
      brief: data.brief,
      status: 'requested' as ProjectStatus,
      urgency: (data.urgency ?? 'standard') as UrgencyLevel,
      target_date: data.target_date,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Project;
  }

  return dbProjectToProject(project as unknown as DbProject);
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    brief?: string;
    expanded_brief?: ExpandedBrief;
    urgency?: UrgencyLevel;
    target_date?: string;
  }
): Promise<Project> {
  const updateData: Database['public']['Tables']['projects']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.brief !== undefined) updateData.brief = data.brief;
  if (data.expanded_brief !== undefined) updateData.expanded_brief = data.expanded_brief as unknown as Database['public']['Tables']['projects']['Update']['expanded_brief'];
  if (data.urgency !== undefined) updateData.urgency = data.urgency;
  if (data.target_date !== undefined) updateData.target_date = data.target_date;

  const { data: project, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select(`
      *,
      client:clients(id, name, logo_url)
    `)
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('プロジェクトの更新に失敗しました');
  }

  return dbProjectToProject(project as unknown as DbProject);
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project status:', error);
    throw new Error('ステータスの更新に失敗しました');
  }

  return dbProjectToProject(project);
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('プロジェクトの削除に失敗しました');
  }
}

// ===== Project Statistics =====

/**
 * Fetch project statistics for an organization
 */
export async function fetchProjectStats(organizationId: string): Promise<{
  total: number;
  by_status: Record<ProjectStatus, number>;
  by_urgency: Record<UrgencyLevel, number>;
}> {
  const { data, error } = await supabase
    .from('projects')
    .select('status, urgency')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching project stats:', error);
    throw new Error('統計情報の取得に失敗しました');
  }

  const stats = {
    total: data?.length ?? 0,
    by_status: {
      requested: 0,
      in_progress: 0,
      in_review: 0,
      approved: 0,
      completed: 0,
      archived: 0,
    } as Record<ProjectStatus, number>,
    by_urgency: {
      standard: 0,
      priority: 0,
      urgent: 0,
      crisis: 0,
    } as Record<UrgencyLevel, number>,
  };

  data?.forEach((project) => {
    if (project.status) {
      stats.by_status[project.status as ProjectStatus]++;
    }
    if (project.urgency) {
      stats.by_urgency[project.urgency as UrgencyLevel]++;
    }
  });

  return stats;
}

/**
 * Fetch project statistics for a client (used in Client Portal)
 */
export async function fetchClientProjectStats(clientId: string): Promise<{
  total: number;
  pending_review: number;
  approved: number;
  in_progress: number;
}> {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('client_id', clientId);

  if (error) {
    console.error('Error fetching client project stats:', error);
    throw new Error('統計情報の取得に失敗しました');
  }

  return {
    total: data?.length ?? 0,
    pending_review: data?.filter((p) => p.status === 'in_review').length ?? 0,
    approved: data?.filter((p) => p.status === 'approved').length ?? 0,
    in_progress: data?.filter((p) => p.status === 'in_progress').length ?? 0,
  };
}

// ===== Client Project Requests =====

/**
 * Create a project request from the Client Portal
 * This allows clients to initiate PR work requests
 */
export async function createClientProjectRequest(
  clientId: string,
  data: {
    name: string;
    brief: string;
    urgency?: UrgencyLevel;
    target_date?: string;
    content_type_hint?: string;
  },
  userId: string
): Promise<Project> {
  // Step 1: Get client details to retrieve organization_id
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('organization_id')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    console.error('Error fetching client:', clientError);
    throw new Error('クライアント情報の取得に失敗しました');
  }

  // Step 2: Insert the project request
  const metadata = data.content_type_hint
    ? { content_type_hint: data.content_type_hint }
    : {};

  const { data: insertedProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      organization_id: client.organization_id,
      client_id: clientId,
      name: data.name,
      brief: data.brief,
      status: 'requested',
      urgency: data.urgency ?? 'standard',
      target_date: data.target_date,
      created_by: userId,
      requested_by_client: true,
      metadata,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating client project request:', insertError);
    throw new Error('リクエストの作成に失敗しました');
  }

  // Step 3: Fetch the full project with relations
  const { data: project, error: selectError } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url)
    `)
    .eq('id', insertedProject.id)
    .single();

  if (selectError) {
    console.error('Error fetching created project request:', selectError);
    // Return minimal data if select fails - project was created
    return {
      id: insertedProject.id,
      organization_id: client.organization_id,
      client_id: clientId,
      name: data.name,
      brief: data.brief,
      status: 'requested' as ProjectStatus,
      urgency: (data.urgency ?? 'standard') as UrgencyLevel,
      target_date: data.target_date,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Project;
  }

  return dbProjectToProject(project as unknown as DbProject);
}

/**
 * Create a project request from the Guided Request Wizard
 * This allows clients to provide detailed brief information
 */
export async function createClientProjectRequestWithBrief(
  clientId: string,
  data: {
    name: string;
    brief: string;
    expanded_brief?: ExpandedBrief;
    urgency?: UrgencyLevel;
    target_date?: string;
    metadata?: Record<string, unknown>;
  },
  _clientName?: string // Reserved for future use (e.g., notifications)
): Promise<Project> {
  // Step 1: Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('認証が必要です');
  }

  // Step 2: Get client details to retrieve organization_id
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('organization_id')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    console.error('Error fetching client:', clientError);
    throw new Error('クライアント情報の取得に失敗しました');
  }

  // Step 3: Insert the project request with expanded_brief
  const { data: insertedProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      organization_id: client.organization_id,
      client_id: clientId,
      name: data.name,
      brief: data.brief,
      expanded_brief: data.expanded_brief as unknown as Database['public']['Tables']['projects']['Insert']['expanded_brief'],
      status: 'requested',
      urgency: data.urgency ?? 'standard',
      target_date: data.target_date,
      created_by: user.id,
      requested_by_client: true,
      metadata: data.metadata ?? {},
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating client project request:', insertError);
    throw new Error('リクエストの作成に失敗しました');
  }

  // Step 4: Fetch the full project with relations
  const { data: project, error: selectError } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url)
    `)
    .eq('id', insertedProject.id)
    .single();

  if (selectError) {
    console.error('Error fetching created project request:', selectError);
    // Return minimal data if select fails - project was created
    return {
      id: insertedProject.id,
      organization_id: client.organization_id,
      client_id: clientId,
      name: data.name,
      brief: data.brief,
      expanded_brief: data.expanded_brief,
      status: 'requested' as ProjectStatus,
      urgency: (data.urgency ?? 'standard') as UrgencyLevel,
      target_date: data.target_date,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Project;
  }

  return dbProjectToProject(project as unknown as DbProject);
}
