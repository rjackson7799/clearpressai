import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import type {
  BriefQuote,
  ContentItem,
  ContentSubType,
  ContentType,
  DistributionChannel,
  DrugLifecycleStatus,
  LengthTier,
  Project,
  ProjectSummary,
  ProjectUrgency,
  TargetAudience,
} from '@/types/domain';

const PROJECTS_KEY = ['projects'] as const;
const PROJECT_SUMMARY_KEY = ['project_summary'] as const;
const projectKey = (id: string) => ['project', id] as const;
const contentItemForProjectKey = (projectId: string) =>
  ['content_item_for_project', projectId] as const;

export function useProjectSummaries() {
  return useQuery({
    queryKey: PROJECT_SUMMARY_KEY,
    queryFn: async (): Promise<ProjectSummary[]> => {
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKey(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useContentItemForProject(projectId: string | undefined) {
  return useQuery({
    queryKey: contentItemForProjectKey(projectId ?? ''),
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ContentItem> => {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('project_id', projectId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateProjectInput {
  client_id: string;
  name: string;
  urgency: ProjectUrgency;
  deadline: string | null;
  content_type: ContentType;
  content_sub_type: ContentSubType;
  language: 'ja' | 'en';
  target_audience: TargetAudience;
  drug_lifecycle_status: DrugLifecycleStatus;
  distribution_channel: DistributionChannel;
  length_tier: LengthTier;
  length_target_chars: number | null;
  enforce_hard_cap: boolean;
  variant_count: number;
  brief_free_text: string;
  brief_key_messages: string[];
  brief_quotes: BriefQuote[];
  brief_data_points: string[];
  brief_constraints: string | null;
}

export interface CreateProjectResult {
  project: Project;
  content_item: ContentItem;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: CreateProjectInput,
    ): Promise<CreateProjectResult> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: input.client_id,
          name: input.name,
          status: 'draft',
          urgency: input.urgency,
          deadline: input.deadline,
          created_by: auth.user.id,
        })
        .select('*')
        .single();
      if (projectError) throw projectError;

      const { data: contentItem, error: contentItemError } = await supabase
        .from('content_items')
        .insert({
          project_id: project.id,
          content_type: input.content_type,
          content_sub_type: input.content_sub_type,
          brief_free_text: input.brief_free_text,
          brief_key_messages: input.brief_key_messages,
          brief_quotes: input.brief_quotes as unknown as Json,
          brief_data_points: input.brief_data_points,
          brief_constraints: input.brief_constraints,
          language: input.language,
          target_audience: input.target_audience,
          drug_lifecycle_status: input.drug_lifecycle_status,
          distribution_channel: input.distribution_channel,
          length_tier: input.length_tier,
          length_target_chars: input.length_target_chars,
          enforce_hard_cap: input.enforce_hard_cap,
          variant_count: input.variant_count,
        })
        .select('*')
        .single();

      if (contentItemError) {
        // Manual rollback — supabase-js has no multi-table transaction.
        await supabase.from('projects').delete().eq('id', project.id);
        throw contentItemError;
      }

      return { project, content_item: contentItem };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      qc.invalidateQueries({ queryKey: PROJECT_SUMMARY_KEY });
    },
  });
}
