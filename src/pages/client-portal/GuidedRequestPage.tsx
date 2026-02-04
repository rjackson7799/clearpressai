/**
 * ClearPress AI - Guided Request Page
 * Multi-step wizard for clients to submit detailed content requests
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClientIdForUser, useClient } from '@/hooks/use-clients';
import { useGuidedRequestWizard, useSubmitGuidedRequest } from '@/hooks/use-guided-request';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  WizardProgress,
  RequestTemplateSelector,
  RequestBasicInfoSection,
  RequestBriefSection,
  RequestContextSection,
  RequestReviewSection,
} from '@/components/client-request';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { RequestWizardStep } from '@/types/client-request';

// Success state component
function SuccessState({
  language,
  projectId,
  onCreateAnother,
}: {
  language: 'ja' | 'en';
  projectId: string;
  onCreateAnother: () => void;
}) {
  return (
    <div className="py-12 text-center animate-fade-up">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-display font-semibold mb-2">
        {language === 'ja'
          ? 'リクエストを送信しました'
          : 'Request Submitted Successfully'}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {language === 'ja'
          ? 'PRチームがリクエストを確認し、すぐに対応いたします。詳細な情報を提供いただいたので、より良いコンテンツを作成できます。'
          : 'Our PR team will review your request and get started shortly. The detailed information you provided will help us create better content.'}
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link to={`/client/projects/${projectId}`}>
            {language === 'ja' ? 'リクエストを確認' : 'View Request'}
          </Link>
        </Button>
        <Button onClick={onCreateAnother}>
          {language === 'ja' ? '別のリクエストを作成' : 'Create Another Request'}
        </Button>
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// Error state component
function ErrorState({
  language,
  message,
}: {
  language: 'ja' | 'en';
  message?: string;
}) {
  return (
    <div className="py-12 text-center">
      <AlertCircle className="h-10 w-10 mx-auto text-destructive/60 mb-3" />
      <p className="text-muted-foreground font-display">
        {message ||
          (language === 'ja'
            ? 'エラーが発生しました'
            : 'An error occurred')}
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/client/projects">
          {language === 'ja' ? '戻る' : 'Go Back'}
        </Link>
      </Button>
    </div>
  );
}

export function GuidedRequestPage() {
  const { language, t } = useLanguage();
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);

  // Get client ID and details
  const { data: clientId, isLoading: isLoadingClientId } = useClientIdForUser();
  const { data: client, isLoading: isLoadingClient } = useClient(clientId ?? undefined);

  // Wizard state management
  const wizard = useGuidedRequestWizard();

  // Submission mutation
  const submitMutation = useSubmitGuidedRequest(clientId ?? undefined, client?.name);

  const isLoading = isLoadingClientId || isLoadingClient;

  // Handle navigation
  const handleNext = () => {
    const validation = wizard.validateCurrentStep();
    if (!validation.isValid) {
      // Errors will be shown in the form
      return;
    }
    wizard.nextStep();
  };

  const handleBack = () => {
    wizard.prevStep();
  };

  const handleStepClick = (step: RequestWizardStep) => {
    // Can navigate to completed steps or current step
    wizard.goToStep(step);
  };

  // Handle submission
  const handleSubmit = async () => {
    const validation = wizard.validateAllSteps();
    if (!validation.isValid) {
      return;
    }

    try {
      const project = await submitMutation.mutateAsync(wizard.data);
      setSubmittedProjectId(project.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle create another
  const handleCreateAnother = () => {
    wizard.reset();
    setSubmittedProjectId(null);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // No client assigned
  if (!clientId || !client) {
    return (
      <ErrorState
        language={language}
        message={
          language === 'ja'
            ? 'クライアントが設定されていません'
            : 'No client assigned'
        }
      />
    );
  }

  // Success state
  if (submittedProjectId) {
    return (
      <SuccessState
        language={language}
        projectId={submittedProjectId}
        onCreateAnother={handleCreateAnother}
      />
    );
  }

  // Get validation errors for current step
  const currentValidation = wizard.validateCurrentStep();

  return (
    <div className="space-y-6 animate-fade-up pb-8">
      {/* Back link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <Link to="/client/projects">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('clientRequest.backToProjects')}
          </Link>
        </Button>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            {t('clientRequest.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('clientRequest.subtitle')}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <WizardProgress
        currentStep={wizard.step}
        completedSteps={wizard.completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Step content */}
      <div className="mt-6">
        {wizard.step === 'template' && (
          <RequestTemplateSelector
            selectedTemplate={wizard.selectedTemplate}
            onSelectTemplate={wizard.selectTemplate}
          />
        )}

        {wizard.step === 'basic' && (
          <RequestBasicInfoSection
            name={wizard.data.name}
            urgency={wizard.data.urgency}
            targetDate={wizard.data.target_date}
            contentTypeHints={wizard.data.content_type_hints}
            onNameChange={wizard.setName}
            onUrgencyChange={wizard.setUrgency}
            onTargetDateChange={wizard.setTargetDate}
            onContentTypeHintsChange={wizard.setContentTypeHints}
            errors={currentValidation.errors}
          />
        )}

        {wizard.step === 'brief' && (
          <RequestBriefSection
            description={wizard.data.description}
            objectives={wizard.data.objectives}
            keyMessages={wizard.data.key_messages}
            targetAudience={wizard.data.target_audience}
            tone={wizard.data.tone}
            customTone={wizard.data.custom_tone}
            specialRequirements={wizard.data.special_requirements}
            onDescriptionChange={wizard.setDescription}
            onObjectivesChange={wizard.setObjectives}
            onKeyMessagesChange={wizard.setKeyMessages}
            onTargetAudienceChange={wizard.setTargetAudience}
            onToneChange={wizard.setTone}
            onCustomToneChange={wizard.setCustomTone}
            onSpecialRequirementsChange={wizard.setSpecialRequirements}
            errors={currentValidation.errors}
          />
        )}

        {wizard.step === 'context' && (
          <RequestContextSection
            productName={wizard.data.product_name}
            therapeuticArea={wizard.data.therapeutic_area}
            keyDates={wizard.data.key_dates}
            regulatoryNotes={wizard.data.regulatory_notes}
            referenceFiles={wizard.data.reference_files}
            onProductNameChange={wizard.setProductName}
            onTherapeuticAreaChange={wizard.setTherapeuticArea}
            onKeyDatesChange={wizard.setKeyDates}
            onRegulatoryNotesChange={wizard.setRegulatoryNotes}
            onReferenceFilesChange={wizard.setReferenceFiles}
          />
        )}

        {wizard.step === 'review' && (
          <RequestReviewSection
            data={wizard.data}
            onEditSection={wizard.goToStep}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
            errors={wizard.validateAllSteps().errors}
          />
        )}
      </div>

      {/* Navigation buttons (not shown on review step) */}
      {wizard.step !== 'review' && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={wizard.currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Button onClick={handleNext}>
            {t('common.next')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default GuidedRequestPage;
