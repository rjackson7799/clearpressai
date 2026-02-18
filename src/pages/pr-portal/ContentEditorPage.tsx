/**
 * ContentEditorPage - Full-featured content editor with three-panel layout
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ← Back to Project    Content Title           Save Status   │  ← Header
 * ├─────────────────────────────────────────────────────────────┤
 * │  B  I  U  │ H1 H2 H3 │ • ─ │ 🔗  │ ISI Block │ [AI Gen ▼] │  ← Toolbar
 * ├───────────────────────────────────────┬─────────────────────┤
 * │                                       │ [Settings] [AI]     │
 * │           Rich Text Editor            │  Content Settings   │
 * │           (Tiptap)                    │  or AI Panel        │
 * └───────────────────────────────────────┴─────────────────────┘
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { ComplianceMark } from '@/components/editor/extensions/compliance-mark';
import { ComplianceTooltip } from '@/components/editor/ComplianceTooltip';
import { useComplianceMarks } from '@/hooks/use-compliance-marks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ISIBlockInserter } from '@/components/editor/ISIBlockInserter';
import { ContentSettings } from '@/components/content/ContentSettings';
import { VersionHistoryDialog } from '@/components/versions';
import {
  GenerationSettingsPanel,
  CompliancePanel,
  ContentPreview,
  type GenerationSettings,
} from '@/components/ai';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useContentItem,
  useUpdateContentItem,
  useUpdateContentStatus,
  useLockContentItem,
  useUnlockContentItem,
} from '@/hooks/use-content';
import { useVersions, useCreateVersion } from '@/hooks/use-versions';
import { useProject } from '@/hooks/use-projects';
import {
  useGenerateContentWithProgress,
  useDebouncedComplianceCheck,
} from '@/hooks/use-ai';
import { useContentRealtime } from '@/hooks/use-content-realtime';
import { ArrowLeft, Save, Cloud, CloudOff, Loader2, Settings, Sparkles, FileDown, SendHorizonal, LayoutList, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/use-keyboard-shortcuts';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';
import type { StructuredContent, ContentType } from '@/types';
import type { ExportOptions } from '@/types/export';
import { ExportDialog } from '@/components/export';
import { exportContentFromEditor } from '@/services/export';
import { structuredContentToHtml, hasStructuredFields, structuredToPlainText } from '@/lib/content-utils';
import { StructuredContentEditor } from '@/components/editor/StructuredContentEditor';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export function ContentEditorPage() {
  const { projectId, contentId } = useParams<{ projectId: string; contentId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Content data
  const { data: content, isLoading: contentLoading } = useContentItem(contentId);
  const { data: versions = [], isLoading: versionsLoading } = useVersions(contentId);
  const { data: project } = useProject(projectId);

  // Mutations
  const updateContentMutation = useUpdateContentItem();
  const updateStatusMutation = useUpdateContentStatus();
  const lockMutation = useLockContentItem();
  const unlockMutation = useUnlockContentItem();
  const createVersionMutation = useCreateVersion();

  // AI hooks
  const { generate, progress, isGenerating } = useGenerateContentWithProgress();
  // Get industry from project client if available (via API join)
  const projectClient = project?.client as { industries?: { industry: { slug: string } }[] } | undefined;
  const industrySlug = projectClient?.industries?.[0]?.industry?.slug || 'general';
  const { check: checkCompliance, result: complianceResult, isChecking } = useDebouncedComplianceCheck(industrySlug);

  // Real-time subscription for content lock monitoring
  useContentRealtime({
    contentItemId: contentId,
    onLockChange: (_item, lockedBy) => {
      // Warn if another user takes the lock while we have it
      if (lockedBy && lockedBy !== user?.id && hasLock.current) {
        toast.warning(
          language === 'ja'
            ? '他のユーザーがこのコンテンツを編集中です'
            : 'Another user is now editing this content'
        );
      }
    },
    onContentUpdate: (item) => {
      // Notify if content was updated externally (e.g., status change)
      if (item.locked_by !== user?.id) {
        toast.info(
          language === 'ja'
            ? 'コンテンツが更新されました'
            : 'Content has been updated'
        );
      }
    },
  });

  // Local state
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'ai'>('settings');
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<StructuredContent | null>(null);
  const [generatedComplianceScore, setGeneratedComplianceScore] = useState(0);
  const hasLock = useRef(false);
  const lastSavedContent = useRef('');
  const initialLoadDone = useRef(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // Refs for stable command palette action wrappers (avoids infinite render loop)
  const handleSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const updateStatusMutationRef = useRef(updateStatusMutation);

  // Structured editor state
  const [editorMode, setEditorMode] = useState<'structured' | 'richtext'>('richtext');
  const [structuredData, setStructuredData] = useState<StructuredContent>({});
  const structuredDataRef = useRef<StructuredContent>({});
  const lastSavedStructured = useRef<string>('');

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: t('editor.placeholder'),
        emptyEditorClass: 'is-editor-empty',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      ComplianceMark,
    ],
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none',
          'focus:outline-none',
          'min-h-[calc(100vh-220px)] px-6 py-4',
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.is-editor-empty:first-child::before]:float-left',
          '[&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:pointer-events-none'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Don't auto-save until initial content has loaded — prevents
      // the empty-editor initialization from overwriting AI-generated content
      if (!initialLoadDone.current) return;

      const html = editor.getHTML();
      const text = editor.getText();
      if (html !== lastSavedContent.current) {
        setSaveStatus('unsaved');
        debouncedAutoSave(html);
      }
      // Trigger compliance check
      if (text.length >= 50) {
        checkCompliance(text);
      }
    },
  });

  // Compliance marks hook for inline highlighting (must be after editor initialization)
  const {
    applyMarks: applyComplianceMarks,
    dismissIssue: dismissComplianceIssue,
    acceptSuggestion: acceptComplianceSuggestion,
    scrollToIssue,
  } = useComplianceMarks({ editor });

  // Load content into editor (only on initial load, not after auto-save refetch)
  useEffect(() => {
    if (content && editor && !initialLoadDone.current) {
      // Cancel any pending auto-saves from editor initialization
      debouncedAutoSave.cancel();
      debouncedStructuredAutoSave.cancel();

      setTitle(content.title);
      const versionContent = content.current_version?.content;

      if (hasStructuredFields(versionContent)) {
        // Content has structured fields — use structured mode
        setEditorMode('structured');
        const data = versionContent || {};
        setStructuredData(data);
        structuredDataRef.current = data;
        lastSavedStructured.current = JSON.stringify(data);
      } else {
        // HTML or plain text content — use rich text mode
        setEditorMode('richtext');
        const htmlContent = structuredContentToHtml(versionContent);
        editor.commands.setContent(htmlContent);
        lastSavedContent.current = editor.getHTML();
      }

      initialLoadDone.current = true;
    }
  }, [content, editor]);

  // Reset initialLoadDone when navigating to a different content item
  useEffect(() => {
    initialLoadDone.current = false;
  }, [contentId]);

  // Store apply function in ref to avoid dependency issues
  const applyComplianceMarksRef = useRef(applyComplianceMarks);
  useEffect(() => {
    applyComplianceMarksRef.current = applyComplianceMarks;
  }, [applyComplianceMarks]);

  // Apply compliance marks when results change
  // Using ref to avoid infinite loop when applyComplianceMarks changes
  useEffect(() => {
    if (complianceResult && editor) {
      applyComplianceMarksRef.current(complianceResult);
    }
  }, [complianceResult, editor]);

  // Acquire lock on mount
  useEffect(() => {
    if (contentId && !hasLock.current) {
      lockMutation.mutate(contentId, {
        onSuccess: () => {
          hasLock.current = true;
        },
        onError: () => {
          toast.error(t('editor.lockFailed'));
        },
      });
    }

    // Release lock on unmount
    return () => {
      if (contentId && hasLock.current) {
        unlockMutation.mutate(contentId);
        hasLock.current = false;
      }
    };
  }, [contentId]);

  // Auto-save with debounce
  const debouncedAutoSave = useDebouncedCallback(
    async (html: string) => {
      if (!contentId || !user?.id) return;

      setSaveStatus('saving');
      try {
        await createVersionMutation.mutateAsync({
          contentItemId: contentId,
          data: {
            content: {
              html,
              plain_text: editor?.getText() ?? '',
            },
          },
        });
        lastSavedContent.current = html;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    2000 // 2 second debounce
  );

  // Auto-save for structured mode
  const debouncedStructuredAutoSave = useDebouncedCallback(
    async (data: StructuredContent) => {
      if (!contentId || !user?.id) return;

      const serialized = JSON.stringify(data);
      if (serialized === lastSavedStructured.current) return;

      setSaveStatus('saving');
      try {
        const plainText = structuredToPlainText(data);
        await createVersionMutation.mutateAsync({
          contentItemId: contentId,
          data: {
            content: { ...data, plain_text: plainText },
          },
        });
        lastSavedStructured.current = serialized;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    2000
  );

  // Cancel pending auto-saves on unmount to prevent stale writes
  useEffect(() => {
    return () => {
      debouncedAutoSave.cancel();
      debouncedStructuredAutoSave.cancel();
    };
  }, [debouncedAutoSave, debouncedStructuredAutoSave]);

  // Handle structured content changes
  const handleStructuredChange = useCallback(
    (data: StructuredContent) => {
      setStructuredData(data);
      structuredDataRef.current = data;
      setSaveStatus('unsaved');
      debouncedStructuredAutoSave(data);

      // Trigger compliance check on structured content
      const plainText = structuredToPlainText(data);
      if (plainText.length >= 50) {
        checkCompliance(plainText);
      }
    },
    [debouncedStructuredAutoSave, checkCompliance]
  );

  // Manual save
  const handleSave = useCallback(async () => {
    if (!contentId || !user?.id) return;

    setSaveStatus('saving');

    try {
      // Update title if changed
      if (title !== content?.title) {
        await updateContentMutation.mutateAsync({
          contentItemId: contentId,
          data: { title },
        });
      }

      if (editorMode === 'structured') {
        // Structured mode save
        const plainText = structuredToPlainText(structuredDataRef.current);
        await createVersionMutation.mutateAsync({
          contentItemId: contentId,
          data: {
            content: { ...structuredDataRef.current, plain_text: plainText },
          },
        });
        lastSavedStructured.current = JSON.stringify(structuredDataRef.current);
      } else {
        // Rich text mode save
        if (!editor) return;
        const html = editor.getHTML();
        await createVersionMutation.mutateAsync({
          contentItemId: contentId,
          data: {
            content: {
              html,
              plain_text: editor.getText(),
            },
          },
        });
        lastSavedContent.current = html;
      }

      setSaveStatus('saved');
      toast.success(t('editor.saved'));
    } catch {
      setSaveStatus('error');
      toast.error(t('editor.saveFailed'));
    }
  }, [contentId, user?.id, editor, title, content?.title, editorMode, updateContentMutation, createVersionMutation, t]);

  // Keep action refs up to date for stable command palette wrappers
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);
  useEffect(() => { updateStatusMutationRef.current = updateStatusMutation; }, [updateStatusMutation]);

  // Insert ISI block
  const handleInsertISI = useCallback((isiContent: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`
      <div class="isi-block border-l-4 border-amber-500 pl-4 my-4 bg-amber-50 p-4 rounded">
        <p class="font-bold text-amber-800 mb-2">重要な安全性情報</p>
        ${isiContent}
      </div>
    `).run();
    setSaveStatus('unsaved');
  }, [editor]);

  // Insert boilerplate
  const handleInsertBoilerplate = useCallback((boilerplateContent: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`
      <div class="boilerplate-block border-l-4 border-blue-500 pl-4 my-4 bg-blue-50 p-4 rounded">
        ${boilerplateContent}
      </div>
    `).run();
    setSaveStatus('unsaved');
  }, [editor]);

  // Version selection
  const handleVersionSelect = useCallback((versionId: string) => {
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;

    if (editorMode === 'structured' && hasStructuredFields(version.content)) {
      // Load structured fields directly
      setStructuredData(version.content);
      structuredDataRef.current = version.content;
      setSaveStatus('unsaved');
    } else if (editor) {
      // Convert to HTML for Tiptap
      const html = structuredContentToHtml(version.content);
      editor.commands.setContent(html);
      setSaveStatus('unsaved');
    }
  }, [versions, editor, editorMode]);

  // Version restored - allow re-loading content from the refetched data
  const handleVersionRestored = useCallback(() => {
    // Reset initialLoadDone so the next content refetch reloads the editor
    initialLoadDone.current = false;
  }, []);

  // AI Content Generation
  const handleGenerate = useCallback(async (settings: GenerationSettings) => {
    if (!projectId || !content) return;

    try {
      const result = await generate({
        project_id: projectId,
        content_type: content.type as ContentType,
        brief: project?.brief || '',
        client_style_profile: project?.client?.style_profile,
        settings: {
          tone: settings.tone,
          custom_tone: settings.customTone,
          target_length: settings.targetLength,
          include_isi: settings.includeISI,
          include_boilerplate: settings.includeBoilerplate,
          language: language as 'ja' | 'en',
        },
      });

      setGeneratedContent(result.content);
      setGeneratedComplianceScore(result.compliance_score);
      setShowPreview(true);
    } catch (error) {
      toast.error(t('ai.generationFailed'));
    }
  }, [projectId, content, project, generate, language, t]);

  // Accept generated content
  const handleAcceptGenerated = useCallback(() => {
    if (!generatedContent) return;

    if (hasStructuredFields(generatedContent)) {
      // AI content has structured fields — switch to structured mode
      setEditorMode('structured');
      setStructuredData(generatedContent);
      structuredDataRef.current = generatedContent;
      setSaveStatus('unsaved');
      debouncedStructuredAutoSave(generatedContent);
    } else if (editor) {
      // Fallback: load as HTML into Tiptap
      const html = structuredContentToHtml(generatedContent);
      editor.commands.setContent(html);
      setSaveStatus('unsaved');
    }

    setShowPreview(false);
    setGeneratedContent(null);
    toast.success(t('ai.accept'));
  }, [editor, generatedContent, t, debouncedStructuredAutoSave]);

  // Reject generated content
  const handleRejectGenerated = useCallback(() => {
    setShowPreview(false);
    setGeneratedContent(null);
  }, []);

  // Export content
  const handleExport = useCallback(async (options: ExportOptions) => {
    if (!content) return;

    let exportHtml: string;
    let exportText: string;
    let exportStructured: StructuredContent | undefined;

    if (editorMode === 'structured') {
      exportStructured = structuredDataRef.current;
      exportHtml = structuredContentToHtml(structuredDataRef.current);
      exportText = structuredToPlainText(structuredDataRef.current);
    } else {
      if (!editor) return;
      exportHtml = editor.getHTML();
      exportText = editor.getText();
    }

    setIsExporting(true);
    try {
      await exportContentFromEditor(
        title || content.title,
        content.type as ContentType,
        exportHtml,
        exportText,
        options,
        {
          projectName: project?.name,
          clientName: project?.client?.name,
          versionNumber: content.current_version?.version_number ?? 1,
          wordCount: content.current_version?.word_count ?? exportText.split(/\s+/).length,
          complianceScore: complianceResult?.score,
        },
        exportStructured
      );
      toast.success(t('export.success'));
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  }, [editor, content, title, project, complianceResult, editorMode, t]);

  // Accept compliance suggestion (from sidebar panel)
  const handleAcceptSuggestion = useCallback((issue: { message: string; suggestion?: string; position?: { start: number; end: number } }) => {
    if (!editor || !issue.suggestion || !issue.position) return;

    // Generate the same ID format used by the compliance marks hook
    const issueId = `${issue.position.start}-${issue.position.end}-${issue.message.slice(0, 20)}`;
    acceptComplianceSuggestion(issueId, issue.suggestion);
    setSaveStatus('unsaved');
    toast.success(t('ai.acceptSuggestion'));
  }, [editor, acceptComplianceSuggestion, t]);

  // View compliance issue in context (scroll to and highlight)
  const handleViewInContext = useCallback((issue: { message: string; position?: { start: number; end: number } }) => {
    if (!issue.position) return;

    // Generate the same ID format used by the compliance marks hook
    const issueId = `${issue.position.start}-${issue.position.end}-${issue.message.slice(0, 20)}`;
    scrollToIssue(issueId);
  }, [scrollToIssue]);

  // Mode switching handler
  const handleModeSwitch = useCallback(
    (mode: 'structured' | 'richtext') => {
      if (mode === editorMode) return;

      // Cancel pending auto-saves from the outgoing mode
      debouncedAutoSave.cancel();
      debouncedStructuredAutoSave.cancel();

      if (mode === 'richtext') {
        // Structured → Rich Text: convert structured content to HTML
        toast.info(t('editor.switchToRichTextWarning'));
        const html = structuredContentToHtml(structuredDataRef.current);
        if (editor) {
          editor.commands.setContent(html);
          lastSavedContent.current = '';
          setSaveStatus('unsaved');
        }
      } else {
        // Rich Text → Structured: warn user, load version's structured fields if available
        toast.info(t('editor.switchToStructuredWarning'));
        const versionContent = content?.current_version?.content;
        if (hasStructuredFields(versionContent)) {
          setStructuredData(versionContent!);
          structuredDataRef.current = versionContent!;
        } else {
          // Start with empty structured fields for this content type
          setStructuredData({});
          structuredDataRef.current = {};
        }
        lastSavedStructured.current = '';
        setSaveStatus('unsaved');
      }

      setEditorMode(mode);
    },
    [editorMode, editor, content, t]
  );

  // Command palette context
  const { registerCommands, unregisterCommand, setActiveContext } = useCommandPalette();

  // Set active context to 'editor' when this page mounts
  useEffect(() => {
    setActiveContext('editor');
    return () => setActiveContext('global');
  }, [setActiveContext]);

  // Define editor-specific commands (actions use refs to avoid unstable deps)
  const hasEditor = !!editor;
  const hasContent = !!content;
  const contentStatus = content?.status;
  const editorCommands = useMemo(() => [
    {
      id: 'editor-save',
      label: t('commandPalette.commands.save'),
      description: t('commandPalette.commands.saveDescription'),
      shortcut: formatShortcut({ key: 's', ctrlOrMeta: true }),
      icon: Save,
      action: () => handleSaveRef.current?.(),
      category: t('commandPalette.categories.content'),
      context: 'editor' as const,
      enabled: !!contentId && hasEditor,
    },
    {
      id: 'editor-generate',
      label: t('commandPalette.commands.generate'),
      description: t('commandPalette.commands.generateDescription'),
      shortcut: formatShortcut({ key: 'g', ctrlOrMeta: true }),
      icon: Sparkles,
      action: () => setSidebarTab('ai'),
      category: t('commandPalette.categories.ai'),
      context: 'editor' as const,
      enabled: hasContent && !isGenerating,
    },
    {
      id: 'editor-submit',
      label: t('commandPalette.commands.submit'),
      description: t('commandPalette.commands.submitDescription'),
      shortcut: formatShortcut({ key: 'enter', ctrlOrMeta: true }),
      icon: SendHorizonal,
      action: async () => {
        if (!contentId || contentStatus !== 'draft') return;
        try {
          await updateStatusMutationRef.current.mutateAsync({
            contentItemId: contentId,
            status: 'submitted',
          });
          toast.success(t('content.submittedForReview'));
        } catch {
          toast.error(t('errors.generic'));
        }
      },
      category: t('commandPalette.categories.content'),
      context: 'editor' as const,
      enabled: contentStatus === 'draft',
    },
  ], [t, contentId, hasEditor, hasContent, isGenerating, contentStatus]);

  // Register editor commands
  useEffect(() => {
    registerCommands(editorCommands);
    return () => {
      editorCommands.forEach(cmd => unregisterCommand(cmd.id));
    };
  }, [editorCommands, registerCommands, unregisterCommand]);

  // Register keyboard shortcuts for editor
  useKeyboardShortcuts([
    {
      key: 's',
      ctrlOrMeta: true,
      handler: handleSave,
      enabled: !!contentId && !!editor,
    },
    {
      key: 'g',
      ctrlOrMeta: true,
      handler: () => setSidebarTab('ai'),
      enabled: !!content && !isGenerating,
    },
    {
      key: 'Enter',
      ctrlOrMeta: true,
      handler: async () => {
        if (!contentId || content?.status !== 'draft') return;
        try {
          await updateStatusMutation.mutateAsync({
            contentItemId: contentId,
            status: 'submitted',
          });
          toast.success(t('content.submittedForReview'));
        } catch {
          toast.error(t('errors.generic'));
        }
      },
      enabled: content?.status === 'draft',
    },
  ]);

  // Loading state
  if (contentLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="w-80 border-l p-4">
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('errors.not_found')}</p>
          <Button asChild>
            <Link to={`/pr/projects/${projectId}`}>{t('common.back')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/pr/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('unsaved');
            }}
            className="font-semibold text-lg border-0 shadow-none focus-visible:ring-0 px-0 h-auto"
            placeholder={t('editor.contentTitle')}
          />
        </div>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} />
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {t('export.title')}
          </Button>
          <Button onClick={handleSave} disabled={saveStatus === 'saving'} className="gap-2">
            {saveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b flex items-center justify-between">
        <div className="flex items-center">
          {/* Mode toggle */}
          <div className="flex items-center border-r px-2">
            <Button
              variant={editorMode === 'structured' ? 'default' : 'ghost'}
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => handleModeSwitch('structured')}
            >
              <LayoutList className="h-3.5 w-3.5" />
              {t('editor.structuredMode')}
            </Button>
            <Button
              variant={editorMode === 'richtext' ? 'default' : 'ghost'}
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => handleModeSwitch('richtext')}
            >
              <FileText className="h-3.5 w-3.5" />
              {t('editor.richTextMode')}
            </Button>
          </div>

          {/* Rich text toolbar (only in richtext mode) */}
          {editorMode === 'richtext' && <EditorToolbar editor={editor} />}
        </div>

        {/* ISI inserter (only in richtext mode) */}
        {editorMode === 'richtext' && (
          <div className="px-2">
            <ISIBlockInserter
              onInsertISI={handleInsertISI}
              onInsertBoilerplate={handleInsertBoilerplate}
            />
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div ref={editorContainerRef} className="flex-1 overflow-y-auto">
          {editorMode === 'structured' ? (
            <StructuredContentEditor
              contentType={(content.type as ContentType) || 'press_release'}
              content={structuredData}
              onChange={handleStructuredChange}
            />
          ) : (
            <>
              <EditorContent editor={editor} />

              {/* Compliance Tooltip for inline issue highlighting */}
              <ComplianceTooltip
                editorElement={editorContainerRef.current}
                onAcceptSuggestion={acceptComplianceSuggestion}
                onDismissIssue={dismissComplianceIssue}
              />
            </>
          )}
        </div>

        {/* Settings sidebar with tabs */}
        <div className="w-80 border-l overflow-hidden bg-muted/30 flex flex-col">
          <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'settings' | 'ai')} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 m-2 mx-4">
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                {t('nav.settings')}
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="flex-1 overflow-y-auto m-0 mt-0">
              <ContentSettings
                content={content}
                versions={versions}
                isLoading={versionsLoading}
                onVersionSelect={handleVersionSelect}
                onViewAllVersions={() => setShowVersionHistory(true)}
                currentVersionId={content.current_version_id}
              />
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-y-auto m-0 mt-0 p-4 space-y-4">
              {/* Generation Settings */}
              <GenerationSettingsPanel
                contentType={content.type as ContentType}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progress={progress}
                disabled={!project?.brief}
                isPharma={industrySlug === 'pharmaceutical'}
              />

              {/* Compliance Panel */}
              <CompliancePanel
                result={complianceResult}
                isChecking={isChecking}
                onRecheck={() => {
                  if (editor) {
                    checkCompliance(editor.getText());
                  }
                }}
                onAcceptSuggestion={handleAcceptSuggestion}
                onViewInContext={handleViewInContext}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Content Preview Dialog */}
      <ContentPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        content={generatedContent}
        complianceScore={generatedComplianceScore}
        wordCount={generatedContent?.plain_text?.length || 0}
        onAccept={handleAcceptGenerated}
        onReject={handleRejectGenerated}
        onRegenerate={() => {
          if (content) {
            handleGenerate({
              tone: 'professional',
              targetLength: 800,
              includeISI: industrySlug === 'pharmaceutical',
              includeBoilerplate: true,
            });
          }
        }}
        isRegenerating={isGenerating}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        versions={versions}
        currentVersionId={content.current_version_id}
        contentItemId={contentId || ''}
        isLoading={versionsLoading}
        onVersionSelect={handleVersionSelect}
        onVersionRestored={handleVersionRestored}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const { t } = useLanguage();

  const config = {
    saved: {
      icon: <Cloud className="h-4 w-4 text-emerald-500" />,
      text: t('editor.saved'),
      className: 'text-emerald-600',
    },
    saving: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      text: t('editor.saving'),
      className: 'text-blue-600',
    },
    unsaved: {
      icon: <CloudOff className="h-4 w-4 text-amber-500" />,
      text: t('editor.unsaved'),
      className: 'text-amber-600',
    },
    error: {
      icon: <CloudOff className="h-4 w-4 text-red-500" />,
      text: t('editor.saveFailed'),
      className: 'text-red-600',
    },
  };

  const { icon, text, className } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1.5', className)}>
      {icon}
      <span className="text-xs">{text}</span>
    </Badge>
  );
}
