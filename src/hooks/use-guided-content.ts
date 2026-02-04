/**
 * ClearPress AI - Guided Content Hook
 * TanStack Query hooks for guided content creation with variant generation
 */

import { useMutation } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { generateContentVariants, enhanceTitle } from '@/services/ai';
import type { ContentGenerationBrief, GenerateVariantsResponse, ContentType } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// ===== Variant Generation =====

/**
 * Generate content variants using AI
 */
export function useGenerateVariants() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (brief: ContentGenerationBrief) => generateContentVariants(brief),
    onError: (error: Error) => {
      toast.error(error.message || t('guidedContent.generationFailed'));
    },
  });
}

/**
 * Generate content variants with progress tracking
 */
export function useGenerateVariantsWithProgress() {
  const [progress, setProgress] = useState<number[]>([0, 0, 0]);
  const [overallProgress, setOverallProgress] = useState(0);
  const generateMutation = useGenerateVariants();

  const generate = useCallback(
    async (brief: ContentGenerationBrief): Promise<GenerateVariantsResponse> => {
      setProgress([0, 0, 0]);
      setOverallProgress(0);

      // Simulate progress during generation
      // Since we're calling a single API that generates all 3 variants,
      // we simulate individual progress for better UX
      const progressIntervals = [
        setInterval(() => {
          setProgress((prev) => {
            const newProgress = [...prev];
            if (newProgress[0] < 90) {
              newProgress[0] += Math.random() * 12;
            }
            return newProgress;
          });
        }, 400),
        setInterval(() => {
          setProgress((prev) => {
            const newProgress = [...prev];
            if (newProgress[1] < 85) {
              newProgress[1] += Math.random() * 10;
            }
            return newProgress;
          });
        }, 500),
        setInterval(() => {
          setProgress((prev) => {
            const newProgress = [...prev];
            if (newProgress[2] < 80) {
              newProgress[2] += Math.random() * 8;
            }
            return newProgress;
          });
        }, 600),
      ];

      // Update overall progress based on individual progress
      const overallInterval = setInterval(() => {
        setProgress((prev) => {
          const avg = prev.reduce((a, b) => a + b, 0) / 3;
          setOverallProgress(Math.min(avg, 95));
          return prev;
        });
      }, 300);

      try {
        const result = await generateMutation.mutateAsync(brief);

        // Set all progress to 100%
        setProgress([100, 100, 100]);
        setOverallProgress(100);

        return result;
      } finally {
        // Cleanup intervals
        progressIntervals.forEach(clearInterval);
        clearInterval(overallInterval);

        // Reset progress after a delay
        setTimeout(() => {
          setProgress([0, 0, 0]);
          setOverallProgress(0);
        }, 1500);
      }
    },
    [generateMutation]
  );

  return {
    generate,
    progress,
    overallProgress,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    reset: generateMutation.reset,
  };
}

// ===== Title Enhancement =====

/**
 * Enhance a title using AI
 * Returns 3 title suggestions
 */
export function useEnhanceTitle() {
  return useMutation({
    mutationFn: ({ title, contentType, context }: {
      title: string;
      contentType: ContentType;
      context?: string;
    }): Promise<string[]> => enhanceTitle(title, contentType, context),
    onError: (error: Error) => {
      console.error('Title enhancement error:', error);
    },
  });
}

// ===== Export types =====
export type { ContentGenerationBrief, GenerateVariantsResponse };
