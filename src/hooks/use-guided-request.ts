/**
 * ClearPress AI - Guided Request Hook
 * State management and submission logic for the guided content request wizard
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClientProjectRequestWithBrief } from '@/services/projects';
import { projectKeys } from './use-projects';
import {
  type ClientRequestWizardData,
  type RequestWizardStep,
  type ClientRequestTemplate,
  type StepValidation,
  initialWizardData,
  validateStep,
  transformToPayload,
} from '@/types/client-request';
import { applyTemplateDefaults } from '@/lib/client-request-templates';
import type { ContentType, ToneType, UrgencyLevel } from '@/types';
import type { UploadedFile } from '@/types/client-request';

const STEP_ORDER: RequestWizardStep[] = ['template', 'basic', 'brief', 'context', 'review'];

/**
 * Hook for managing guided request wizard state
 */
export function useGuidedRequestWizard() {
  const { language } = useLanguage();
  const [step, setStep] = useState<RequestWizardStep>('template');
  const [data, setData] = useState<ClientRequestWizardData>(initialWizardData);
  const [completedSteps, setCompletedSteps] = useState<RequestWizardStep[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ClientRequestTemplate | null>(null);

  // Get current step index
  const currentStepIndex = STEP_ORDER.indexOf(step);

  // Navigation
  const goToStep = useCallback((targetStep: RequestWizardStep) => {
    setStep(targetStep);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(step)) {
        setCompletedSteps((prev) => [...prev, step]);
      }
      setStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [step, completedSteps]);

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  // Validation
  const validateCurrentStep = useCallback((): StepValidation => {
    return validateStep(step, data, language);
  }, [step, data, language]);

  const validateAllSteps = useCallback((): StepValidation => {
    return validateStep('review', data, language);
  }, [data, language]);

  // Template selection
  const selectTemplate = useCallback(
    (template: ClientRequestTemplate | null) => {
      setSelectedTemplate(template);
      if (template) {
        setData((prev) => applyTemplateDefaults(template, prev));
      }
    },
    []
  );

  // Field setters
  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }));
  }, []);

  const setUrgency = useCallback((urgency: UrgencyLevel) => {
    setData((prev) => ({ ...prev, urgency }));
  }, []);

  const setTargetDate = useCallback((target_date: string | undefined) => {
    setData((prev) => ({ ...prev, target_date }));
  }, []);

  const setContentTypeHints = useCallback((content_type_hints: ContentType[]) => {
    setData((prev) => ({ ...prev, content_type_hints }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setData((prev) => ({ ...prev, description }));
  }, []);

  const setObjectives = useCallback((objectives: string[]) => {
    setData((prev) => ({ ...prev, objectives }));
  }, []);

  const setKeyMessages = useCallback((key_messages: string[]) => {
    setData((prev) => ({ ...prev, key_messages }));
  }, []);

  const setTargetAudience = useCallback((target_audience: string) => {
    setData((prev) => ({ ...prev, target_audience }));
  }, []);

  const setTone = useCallback((tone: ToneType) => {
    setData((prev) => ({ ...prev, tone }));
  }, []);

  const setCustomTone = useCallback((custom_tone: string | undefined) => {
    setData((prev) => ({ ...prev, custom_tone }));
  }, []);

  const setSpecialRequirements = useCallback((special_requirements: string | undefined) => {
    setData((prev) => ({ ...prev, special_requirements }));
  }, []);

  const setProductName = useCallback((product_name: string | undefined) => {
    setData((prev) => ({ ...prev, product_name }));
  }, []);

  const setTherapeuticArea = useCallback((therapeutic_area: string | undefined) => {
    setData((prev) => ({ ...prev, therapeutic_area }));
  }, []);

  const setKeyDates = useCallback((key_dates: string | undefined) => {
    setData((prev) => ({ ...prev, key_dates }));
  }, []);

  const setRegulatoryNotes = useCallback((regulatory_notes: string | undefined) => {
    setData((prev) => ({ ...prev, regulatory_notes }));
  }, []);

  const setReferenceFiles = useCallback((reference_files: UploadedFile[]) => {
    setData((prev) => ({ ...prev, reference_files }));
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    setStep('template');
    setData(initialWizardData);
    setCompletedSteps([]);
    setSelectedTemplate(null);
  }, []);

  return {
    // State
    step,
    data,
    completedSteps,
    selectedTemplate,
    currentStepIndex,
    totalSteps: STEP_ORDER.length,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Validation
    validateCurrentStep,
    validateAllSteps,

    // Template
    selectTemplate,

    // Field setters
    setName,
    setUrgency,
    setTargetDate,
    setContentTypeHints,
    setDescription,
    setObjectives,
    setKeyMessages,
    setTargetAudience,
    setTone,
    setCustomTone,
    setSpecialRequirements,
    setProductName,
    setTherapeuticArea,
    setKeyDates,
    setRegulatoryNotes,
    setReferenceFiles,

    // Reset
    reset,
  };
}

/**
 * Hook for submitting the guided request
 */
export function useSubmitGuidedRequest(
  clientId: string | undefined,
  clientName: string | undefined
) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientRequestWizardData) => {
      if (!clientId || !clientName) {
        throw new Error('Client not found');
      }

      const payload = transformToPayload(data);

      return createClientProjectRequestWithBrief(
        clientId,
        {
          name: payload.name,
          brief: payload.brief,
          expanded_brief: payload.expanded_brief,
          urgency: payload.urgency,
          target_date: payload.target_date,
          metadata: payload.metadata,
        },
        clientName
      );
    },
    onSuccess: () => {
      // Invalidate project queries
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success(t('clientRequest.successTitle'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.error'));
    },
  });
}
