/**
 * ClearPress AI - Client Dashboard Service
 * Fetches dashboard data for client portal
 */

import { supabase } from './supabase';

export interface ClientDashboardStats {
  pendingCount: number;
  approvedCount: number;
}

export interface PendingItem {
  id: string;
  title: string;
  type: string;
  projectName: string;
  projectId: string;
  submittedAt: string;
}

export interface RecentProject {
  id: string;
  name: string;
  status: string;
  urgency: string;
  contentCount: number;
  updatedAt: string;
}

/**
 * Get the client_id for a user from the client_users junction table
 */
export async function getClientIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching client_id for user:', error);
    return null;
  }

  return data.client_id;
}

/**
 * Fetch dashboard stats using project join for client user
 */
export async function fetchClientStats(clientId: string): Promise<ClientDashboardStats> {
  // First get all projects for this client
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', clientId);

  if (projectsError || !projects?.length) {
    return { pendingCount: 0, approvedCount: 0 };
  }

  const projectIds = projects.map(p => p.id);

  // Get pending content items
  const { count: pendingCount } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .in('status', ['submitted', 'in_review']);

  // Get approved content items
  const { count: approvedCount } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('status', 'approved');

  return {
    pendingCount: pendingCount || 0,
    approvedCount: approvedCount || 0,
  };
}

/**
 * Fetch pending items for client review
 */
export async function fetchPendingItems(clientId: string, limit: number = 5): Promise<PendingItem[]> {
  // First get all projects for this client
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('client_id', clientId);

  if (projectsError || !projects?.length) {
    return [];
  }

  const projectIds = projects.map(p => p.id);
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  // Get pending content items
  const { data: items, error } = await supabase
    .from('content_items')
    .select('id, title, type, project_id, updated_at')
    .in('project_id', projectIds)
    .in('status', ['submitted', 'in_review'])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !items) {
    console.error('Error fetching pending items:', error);
    return [];
  }

  return items.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    projectName: projectMap.get(item.project_id) || 'Unknown',
    projectId: item.project_id,
    submittedAt: item.updated_at || new Date().toISOString(),
  }));
}

/**
 * Fetch recent projects for client
 */
export async function fetchRecentProjects(clientId: string, limit: number = 5): Promise<RecentProject[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      status,
      urgency,
      updated_at,
      content_items(id)
    `)
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !projects) {
    console.error('Error fetching recent projects:', error);
    return [];
  }

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status || 'draft',
    urgency: project.urgency || 'standard',
    contentCount: Array.isArray(project.content_items) ? project.content_items.length : 0,
    updatedAt: project.updated_at || new Date().toISOString(),
  }));
}
