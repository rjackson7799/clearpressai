import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { BilingualLabel } from '@/components/shared/BilingualLabel';

const AUTOSAVE_DEBOUNCE_MS = 1500;

export interface VariantEditorProps {
  initialBodyText: string;
  onSave: (body: string) => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
  readOnly?: boolean;
}

function tiptapBodyToText(html: string): string {
  // StarterKit + plain-text serialization: paragraphs separated by blank
  // lines, no markdown — the variant body model is plain text.
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks: string[] = [];
  for (const child of Array.from(div.children)) {
    blocks.push((child.textContent ?? '').trim());
  }
  if (blocks.length === 0) {
    return (div.textContent ?? '').trim();
  }
  return blocks.join('\n\n');
}

function textToTiptapDoc(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const escaped = p
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

export function VariantEditor({
  initialBodyText,
  onSave,
  onDirtyChange,
  readOnly = false,
}: VariantEditorProps) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const latestBodyRef = useRef(initialBodyText);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: '' })],
    content: textToTiptapDoc(initialBodyText),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none font-serif text-[15px] leading-7 min-h-[12rem] focus:outline-none',
      },
    },
  });

  const commitSave = useCallback(async () => {
    if (!editor) return;
    const body = tiptapBodyToText(editor.getHTML());
    if (body === latestBodyRef.current) return;
    setSaving(true);
    try {
      await onSave(body);
      latestBodyRef.current = body;
      setSavedAt(Date.now());
      setDirty(false);
      onDirtyChange?.(false);
    } finally {
      setSaving(false);
    }
  }, [editor, onSave, onDirtyChange]);

  useEffect(() => {
    if (!editor || readOnly) return;
    const handler = () => {
      const body = tiptapBodyToText(editor.getHTML());
      const isDirty = body !== latestBodyRef.current;
      if (isDirty !== dirty) {
        setDirty(isDirty);
        onDirtyChange?.(isDirty);
      }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (isDirty) {
        saveTimerRef.current = window.setTimeout(() => {
          void commitSave();
        }, AUTOSAVE_DEBOUNCE_MS);
      }
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [editor, dirty, commitSave, onDirtyChange, readOnly]);

  if (!editor) {
    return <div className="min-h-[12rem]" />;
  }

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} />
      {!readOnly && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {saving ? (
              <BilingualLabel ja="保存中…" en="Saving…" />
            ) : dirty ? (
              <BilingualLabel ja="未保存の変更があります" en="Unsaved changes" />
            ) : savedAt ? (
              <BilingualLabel ja="保存済" en="Saved" />
            ) : null}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => {
              if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
              }
              void commitSave();
            }}
          >
            <BilingualLabel ja="保存" en="Save" />
          </Button>
        </div>
      )}
    </div>
  );
}
