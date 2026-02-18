/**
 * GuidedContentPage - Full-page wizard for AI-assisted content creation
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjects } from '@/hooks/use-projects';
import { useCreateContentItem } from '@/hooks/use-content';
import { useCreateVersion } from '@/hooks/use-versions';
import { useGenerateVariantsWithProgress, useEnhanceTitle } from '@/hooks/use-guided-content';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  TemplateSelector,
  BasicInfoSection,
  ContentBriefSection,
  AudienceStyleSection,
  PharmaDetailsSection,
  GenerationProgress,
  VariantPicker,
} from '@/components/content/guided';

import type {
  ContentType,
  ToneType,
  ContentTemplate,
  ContentGenerationBrief,
  ContentVariant,
} from '@/types';
import { DEFAULT_TARGET_LENGTHS } from '@/lib/content-templates';

type WizardStep = 'form' | 'generating' | 'variants';

export function GuidedContentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  // Get project ID from URL if provided
  const initialProjectId = searchParams.get('project') || '';

  // Hooks
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const createContentItem = useCreateContentItem();
  const createVersion = useCreateVersion();
  const {
    generate,
    progress,
    overallProgress,
    isGenerating,
    reset: resetGeneration,
  } = useGenerateVariantsWithProgress();
  const enhanceTitle = useEnhanceTitle();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('form');
  const [generatedVariants, setGeneratedVariants] = useState<ContentVariant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  // Form state
  const [projectId, setProjectId] = useState(initialProjectId);
  const [contentType, setContentType] = useState<ContentType>('press_release');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [keyMessages, setKeyMessages] = useState<string[]>([]);
  const [callToAction, setCallToAction] = useState('');
  const [targetAudience, setTargetAudience] = useState('healthcare_professionals');
  const [tone, setTone] = useState<ToneType>('professional');
  const [customTone, setCustomTone] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [targetLength, setTargetLength] = useState(DEFAULT_TARGET_LENGTHS.press_release);
  const [productName, setProductName] = useState('');
  const [therapeuticArea, setTherapeuticArea] = useState('');
  const [includeIsi, setIncludeIsi] = useState(true);
  const [includeBoilerplate, setIncludeBoilerplate] = useState(true);
  const [regulatoryNotes, setRegulatoryNotes] = useState('');

  const projects = projectsData?.data || [];

  // Update target length when content type changes
  useEffect(() => {
    setTargetLength(DEFAULT_TARGET_LENGTHS[contentType] || 800);
  }, [contentType]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate?.defaults) {
      const d = selectedTemplate.defaults;
      if (d.content_type) setContentType(d.content_type);
      if (d.tone) setTone(d.tone);
      if (d.target_audience) setTargetAudience(d.target_audience);
      if (d.include_isi !== undefined) setIncludeIsi(d.include_isi);
      if (d.include_boilerplate !== undefined) setIncludeBoilerplate(d.include_boilerplate);
      if (d.target_length) setTargetLength(d.target_length);
      if (d.key_messages) setKeyMessages(d.key_messages.filter(Boolean));
    }
  }, [selectedTemplate]);

  // Validate form
  const isFormValid = useCallback(() => {
    return projectId && title.trim() && summary.trim();
  }, [projectId, title, summary]);

  // Handle title enhancement
  const handleEnhanceTitle = useCallback(async () => {
    if (!title.trim()) return;
    try {
      const suggestions = await enhanceTitle.mutateAsync({
        title,
        contentType,
        context: summary,
      });
      // Use the first suggestion if available and different from current title
      const enhanced = Array.isArray(suggestions) ? suggestions[0] : suggestions;
      if (enhanced && enhanced !== title) {
        setTitle(enhanced);
        toast.success(t('common.success'));
      }
    } catch {
      // Error handled in hook
    }
  }, [title, contentType, summary, enhanceTitle, t]);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!isFormValid()) {
      if (!projectId) toast.error(t('guidedContent.projectRequired'));
      else if (!title.trim()) toast.error(t('guidedContent.titleRequired'));
      else if (!summary.trim()) toast.error(t('guidedContent.summaryRequired'));
      return;
    }

    setStep('generating');

    const brief: ContentGenerationBrief = {
      project_id: projectId,
      content_type: contentType,
      title,
      summary,
      key_messages: keyMessages.filter(Boolean),
      call_to_action: callToAction || undefined,
      target_audience: targetAudience,
      tone,
      custom_tone: tone === 'custom' ? customTone : undefined,
      keywords: keywords.filter(Boolean),
      target_length: targetLength,
      product_name: productName || undefined,
      therapeutic_area: therapeuticArea || undefined,
      include_isi: includeIsi,
      include_boilerplate: includeBoilerplate,
      regulatory_notes: regulatoryNotes || undefined,
    };

    try {
      const result = await generate(brief);
      if (result.variants && result.variants.length > 0) {
        setGeneratedVariants(result.variants);
        setStep('variants');
      } else {
        throw new Error('No variants generated');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      const message =
        error instanceof Error && error.message !== 'No variants generated'
          ? error.message
          : t('guidedContent.generationFailed');
      toast.error(message);
      setStep('form');
    }
  }, [
    isFormValid,
    projectId,
    contentType,
    title,
    summary,
    keyMessages,
    callToAction,
    targetAudience,
    tone,
    customTone,
    keywords,
    targetLength,
    productName,
    therapeuticArea,
    includeIsi,
    includeBoilerplate,
    regulatoryNotes,
    generate,
    t,
  ]);

  // Handle cancel generation
  const handleCancelGeneration = useCallback(() => {
    resetGeneration();
    setStep('form');
  }, [resetGeneration]);

  // Handle variant selection
  const handleSelectVariant = useCallback(
    async (variant: ContentVariant) => {
      try {
        // Step 1: Create the content item
        const contentItem = await createContentItem.mutateAsync({
          projectId,
          data: {
            type: contentType,
            title,
            settings: {
              tone,
              target_length: targetLength,
              include_isi: includeIsi,
              include_boilerplate: includeBoilerplate,
            },
          },
        });

        // Step 2: Create the first version with the selected variant content
        await createVersion.mutateAsync({
          contentItemId: contentItem.id,
          data: {
            content: variant.content,
            compliance_score: variant.compliance_score,
            word_count: variant.word_count,
            generation_params: variant.generation_params,
          },
        });

        // Navigate to the editor
        navigate(`/pr/projects/${projectId}/content/${contentItem.id}`);
        toast.success(t('content.newContent'));
      } catch (error) {
        console.error('Failed to create content:', error);
        toast.error(t('common.error'));
      }
    },
    [projectId, contentType, title, tone, targetLength, includeIsi, includeBoilerplate, createContentItem, createVersion, navigate, t]
  );

  // Handle back to edit
  const handleBackToEdit = useCallback(() => {
    setStep('form');
  }, []);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Loading state
  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pr/content')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('guidedContent.backToContent')}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{t('guidedContent.title')}</h1>
        <p className="text-muted-foreground">{t('guidedContent.subtitle')}</p>
      </div>

      {/* Generation Progress Overlay */}
      {step === 'generating' && (
        <GenerationProgress
          progress={progress}
          overallProgress={overallProgress}
          onCancel={handleCancelGeneration}
        />
      )}

      {/* Variant Picker */}
      {step === 'variants' && (
        <VariantPicker
          variants={generatedVariants}
          onSelectVariant={handleSelectVariant}
          onRegenerate={handleRegenerate}
          onBackToEdit={handleBackToEdit}
          isRegenerating={isGenerating}
        />
      )}

      {/* Form */}
      {step === 'form' && (
        <div className="space-y-6">
          {/* Template Selector */}
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />

          {/* Basic Info */}
          <BasicInfoSection
            projects={projects}
            projectId={projectId}
            contentType={contentType}
            title={title}
            onProjectChange={setProjectId}
            onContentTypeChange={setContentType}
            onTitleChange={setTitle}
            onEnhanceTitle={handleEnhanceTitle}
            isEnhancing={enhanceTitle.isPending}
          />

          {/* Content Brief */}
          <ContentBriefSection
            summary={summary}
            keyMessages={keyMessages}
            callToAction={callToAction}
            onSummaryChange={setSummary}
            onKeyMessagesChange={setKeyMessages}
            onCallToActionChange={setCallToAction}
          />

          {/* Audience & Style */}
          <AudienceStyleSection
            targetAudience={targetAudience}
            tone={tone}
            customTone={customTone}
            keywords={keywords}
            targetLength={targetLength}
            contentType={contentType}
            onTargetAudienceChange={setTargetAudience}
            onToneChange={setTone}
            onCustomToneChange={setCustomTone}
            onKeywordsChange={setKeywords}
            onTargetLengthChange={setTargetLength}
          />

          {/* Pharmaceutical Details */}
          <PharmaDetailsSection
            productName={productName}
            therapeuticArea={therapeuticArea}
            includeIsi={includeIsi}
            includeBoilerplate={includeBoilerplate}
            regulatoryNotes={regulatoryNotes}
            onProductNameChange={setProductName}
            onTherapeuticAreaChange={setTherapeuticArea}
            onIncludeIsiChange={setIncludeIsi}
            onIncludeBoilerplateChange={setIncludeBoilerplate}
            onRegulatoryNotesChange={setRegulatoryNotes}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/pr/content')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid() || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t('guidedContent.generateVariants')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuidedContentPage;
