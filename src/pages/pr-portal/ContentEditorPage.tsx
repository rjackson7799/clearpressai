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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
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
import { ArrowLeft, Save, Cloud, CloudOff, Loader2, Settings, Sparkles, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import type { StructuredContent, ContentType } from '@/types';
import type { ExportOptions } from '@/types/export';
import { ExportDialog } from '@/components/export';
import { exportContentFromEditor } from '@/services/export';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export function ContentEditorPage() {
  const { projectId, contentId } = useParams<{ projectId: string; contentId: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Content data
  const { data: content, isLoading: contentLoading } = useContentItem(contentId);
  const { data: versions = [], isLoading: versionsLoading } = useVersions(contentId);
  const { data: project } = useProject(projectId);

  // Mutations
  const updateContentMutation = useUpdateContentItem();
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

  // Load content into editor
  useEffect(() => {
    if (content && editor) {
      setTitle(content.title);
      const htmlContent = content.current_version?.content?.html ??
                          content.current_version?.content?.plain_text ??
                          '';
      editor.commands.setContent(htmlContent);
      lastSavedContent.current = editor.getHTML();
    }
  }, [content, editor]);

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

  // Manual save
  const handleSave = useCallback(async () => {
    if (!contentId || !user?.id || !editor) return;

    const html = editor.getHTML();
    setSaveStatus('saving');

    try {
      // Update title if changed
      if (title !== content?.title) {
        await updateContentMutation.mutateAsync({
          contentItemId: contentId,
          data: { title },
        });
      }

      // Create new version
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
      setSaveStatus('saved');
      toast.success(t('editor.saved'));
    } catch {
      setSaveStatus('error');
      toast.error(t('editor.saveFailed'));
    }
  }, [contentId, user?.id, editor, title, content?.title, updateContentMutation, createVersionMutation, t]);

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
    if (version && editor) {
      const html = version.content?.html ?? version.content?.plain_text ?? '';
      editor.commands.setContent(html);
      setSaveStatus('unsaved');
    }
  }, [versions, editor]);

  // Version restored - reload the latest content
  const handleVersionRestored = useCallback(() => {
    // The version hooks will auto-refresh, and we need to reload the editor
    // with the new current version content
    if (content && editor) {
      const htmlContent = content.current_version?.content?.html ??
                          content.current_version?.content?.plain_text ??
                          '';
      editor.commands.setContent(htmlContent);
      lastSavedContent.current = editor.getHTML();
      setSaveStatus('saved');
    }
  }, [content, editor]);

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
    if (!editor || !generatedContent) return;

    // Convert structured content to HTML
    let html = '';
    if (generatedContent.headline) {
      html += `<h1>${generatedContent.headline}</h1>`;
    }
    if (generatedContent.subheadline) {
      html += `<h2>${generatedContent.subheadline}</h2>`;
    }
    if (generatedContent.dateline) {
      html += `<p><em>${generatedContent.dateline}</em></p>`;
    }
    if (generatedContent.lead) {
      html += `<p><strong>${generatedContent.lead}</strong></p>`;
    }
    if (generatedContent.body) {
      html += generatedContent.body.map(p => `<p>${p}</p>`).join('');
    }
    if (generatedContent.quotes) {
      generatedContent.quotes.forEach(q => {
        html += `<blockquote><p>「${q.text}」</p><footer>— ${q.attribution}</footer></blockquote>`;
      });
    }
    if (generatedContent.isi) {
      html += `<div class="isi-block border-l-4 border-amber-500 pl-4 my-4 bg-amber-50 p-4 rounded">
        <p class="font-bold text-amber-800 mb-2">重要な安全性情報</p>
        <p>${generatedContent.isi}</p>
      </div>`;
    }
    if (generatedContent.boilerplate) {
      html += `<div class="boilerplate-block border-l-4 border-blue-500 pl-4 my-4 bg-blue-50 p-4 rounded">
        <p>${generatedContent.boilerplate}</p>
      </div>`;
    }
    if (generatedContent.contact) {
      html += `<p><strong>お問い合わせ先:</strong> ${generatedContent.contact}</p>`;
    }

    editor.commands.setContent(html);
    setSaveStatus('unsaved');
    setShowPreview(false);
    setGeneratedContent(null);
    toast.success(t('ai.accept'));
  }, [editor, generatedContent, t]);

  // Reject generated content
  const handleRejectGenerated = useCallback(() => {
    setShowPreview(false);
    setGeneratedContent(null);
  }, []);

  // Export content
  const handleExport = useCallback(async (options: ExportOptions) => {
    if (!editor || !content) return;

    setIsExporting(true);
    try {
      await exportContentFromEditor(
        title || content.title,
        content.type as ContentType,
        editor.getHTML(),
        editor.getText(),
        options,
        {
          projectName: project?.name,
          clientName: project?.client?.name,
          versionNumber: content.current_version?.version_number ?? 1,
          wordCount: content.current_version?.word_count ?? editor.getText().split(/\s+/).length,
          complianceScore: complianceResult?.score,
        }
      );
      toast.success(t('export.success'));
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  }, [editor, content, title, project, complianceResult, t]);

  // Accept compliance suggestion
  const handleAcceptSuggestion = useCallback((issue: { suggestion?: string; position?: { start: number; end: number } }) => {
    if (!editor || !issue.suggestion || !issue.position) return;

    const text = editor.getText();
    const beforeText = text.substring(issue.position.start, issue.position.end);

    // Replace the text at the position
    const content = editor.getHTML();
    const newContent = content.replace(beforeText, issue.suggestion);
    editor.commands.setContent(newContent);
    setSaveStatus('unsaved');
    toast.success(t('ai.acceptSuggestion'));
  }, [editor, t]);

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
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/pr/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
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
        <EditorToolbar editor={editor} />
        <div className="px-2">
          <ISIBlockInserter
            onInsertISI={handleInsertISI}
            onInsertBoilerplate={handleInsertBoilerplate}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
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
