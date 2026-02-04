/**
 * ClearPress AI - AI Hooks
 * TanStack Query hooks for AI-powered operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateContent,
  checkCompliance,
  expandBrief,
  adjustTone,
  extractStyle,
  type GenerateContentRequest,
  type GenerateContentResponse,
  type CheckComplianceRequest,
  type CheckComplianceResponse,
  type ExpandBriefRequest,
  type ExpandBriefResponse,
  type AdjustToneRequest,
  type AdjustToneResponse,
  type ExtractStyleRequest,
  type ExtractStyleResponse,
  type ExtractedStyle,
} from '@/services/ai';
import { projectKeys } from './use-projects';
import { clientKeys } from './use-clients';
import { fileKeys } from './use-files';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useState, useCallback, useEffect, useRef } from 'react';

// ===== Content Generation =====

/**
 * Generate content using AI
 */
export function useGenerateContent() {
  return useMutation({
    mutationFn: (request: GenerateContentRequest) => generateContent(request),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Generate content with loading state and progress
 */
export function useGenerateContentWithProgress() {
  const [progress, setProgress] = useState(0);
  const generateMutation = useGenerateContent();
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const generate = useCallback(
    async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
      setProgress(0);

      // Simulate progress during generation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      try {
        const result = await generateMutation.mutateAsync(request);
        setProgress(100);
        return result;
      } finally {
        clearInterval(progressInterval);
        // Reset progress after a delay, only if still mounted
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setProgress(0);
          }
        }, 1000);
      }
    },
    [generateMutation.mutateAsync]
  );

  return {
    generate,
    progress,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    reset: generateMutation.reset,
  };
}

// ===== Compliance Checking =====

/**
 * Check content compliance
 */
export function useCheckCompliance() {
  return useMutation({
    mutationFn: (request: CheckComplianceRequest) => checkCompliance(request),
    onError: (error: Error) => {
      console.error('Compliance check error:', error);
      // Don't show toast for compliance errors (too frequent)
    },
  });
}

/**
 * Debounced compliance checking for real-time editor integration
 */
export function useDebouncedComplianceCheck(
  industrySlug: string,
  debounceMs: number = 1000
) {
  const [result, setResult] = useState<CheckComplianceResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkMutation = useCheckCompliance();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<string>('');

  const check = useCallback(
    (content: string) => {
      // Skip if content is too short or unchanged
      if (content.length < 50 || content === lastContentRef.current) {
        return;
      }

      lastContentRef.current = content;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        setIsChecking(true);
        try {
          const response = await checkMutation.mutateAsync({
            content,
            industry_slug: industrySlug,
          });
          setResult(response);
        } catch {
          // Error handled in mutation
        } finally {
          setIsChecking(false);
        }
      }, debounceMs);
    },
    [checkMutation, industrySlug, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    lastContentRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    check,
    result,
    isChecking,
    reset,
  };
}

// ===== Brief Expansion =====

/**
 * Expand a project brief using AI
 */
export function useExpandBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ExpandBriefRequest) => expandBrief(request),
    onSuccess: (_, variables) => {
      // Invalidate project to refresh expanded brief
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.project_id),
      });
      toast.success('ブリーフを展開しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ===== Tone Adjustment =====

/**
 * Adjust content tone using AI
 */
export function useAdjustTone() {
  return useMutation({
    mutationFn: (request: AdjustToneRequest) => adjustTone(request),
    onSuccess: () => {
      toast.success('トーンを調整しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ===== Style Extraction =====

/**
 * Extract style profile from uploaded reference documents
 */
export function useExtractStyle() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (request: ExtractStyleRequest) => extractStyle(request),
    onSuccess: (data, variables) => {
      // Invalidate client to refresh style profile
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.client_id),
      });
      // Invalidate client style files
      queryClient.invalidateQueries({
        queryKey: fileKeys.clientStyle(variables.client_id),
      });

      if (data.success) {
        toast.success(t('styleExtraction.extractSuccess'));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t('styleExtraction.extractError'));
    },
  });
}

/**
 * Extract style with progress tracking
 */
export function useExtractStyleWithProgress() {
  const [progress, setProgress] = useState(0);
  const extractMutation = useExtractStyle();
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const extract = useCallback(
    async (request: ExtractStyleRequest): Promise<ExtractStyleResponse> => {
      setProgress(0);

      // Simulate progress during extraction
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      try {
        const result = await extractMutation.mutateAsync(request);
        setProgress(100);
        return result;
      } finally {
        clearInterval(progressInterval);
        // Reset progress after a delay, only if still mounted
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setProgress(0);
          }
        }, 1000);
      }
    },
    [extractMutation.mutateAsync]
  );

  return {
    extract,
    progress,
    isExtracting: extractMutation.isPending,
    error: extractMutation.error,
    reset: extractMutation.reset,
    data: extractMutation.data,
  };
}

// ===== Export types for consumers =====
export type {
  GenerateContentRequest,
  GenerateContentResponse,
  CheckComplianceRequest,
  CheckComplianceResponse,
  ExpandBriefRequest,
  ExpandBriefResponse,
  AdjustToneRequest,
  AdjustToneResponse,
  ExtractStyleRequest,
  ExtractStyleResponse,
  ExtractedStyle,
};
