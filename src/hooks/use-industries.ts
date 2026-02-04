/**
 * ClearPress AI - Industries Hooks
 * TanStack Query hooks for industry operations
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchIndustries,
  fetchIndustry,
  fetchIndustryBySlug,
} from '@/services/industries';
// Types imported from services

// ===== Query Keys =====

export const industryKeys = {
  all: ['industries'] as const,
  lists: () => [...industryKeys.all, 'list'] as const,
  list: () => [...industryKeys.lists()] as const,
  details: () => [...industryKeys.all, 'detail'] as const,
  detail: (id: string) => [...industryKeys.details(), id] as const,
  bySlug: (slug: string) => [...industryKeys.details(), 'slug', slug] as const,
};

// ===== Hooks =====

/**
 * Fetch all active industries
 */
export function useIndustries() {
  return useQuery({
    queryKey: industryKeys.list(),
    queryFn: fetchIndustries,
    staleTime: 5 * 60 * 1000, // 5 minutes (industries rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Fetch a single industry by ID
 */
export function useIndustry(industryId: string | undefined) {
  return useQuery({
    queryKey: industryKeys.detail(industryId ?? ''),
    queryFn: () => {
      if (!industryId) throw new Error('Industry ID required');
      return fetchIndustry(industryId);
    },
    enabled: !!industryId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single industry by slug
 */
export function useIndustryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: industryKeys.bySlug(slug ?? ''),
    queryFn: () => {
      if (!slug) throw new Error('Industry slug required');
      return fetchIndustryBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
