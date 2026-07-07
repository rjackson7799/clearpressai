import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickLang } from '@/lib/bilingual';

interface Props {
  initialHtml: string;
  onChange: (next: { html: string; text: string }) => void;
}

// Minimal Tiptap surface for the delivery message body. The composer reseeds
// via a key prop when the variant comparison summary regenerates, so this
// component doesn't have to react to initialHtml changes itself.
//
// extension-link is deliberately NOT pulled in for T7 (would add a dep
// outside this task's frontend-wiring scope) — Phase 7 polish or T8 can add
// link/heading/blockquote support if the user wants them.
export function DeliveryBodyEditor({ initialHtml, onChange }: Props) {
  const { i18n } = useTranslation();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: pickLang(
          i18n.language,
          'メール本文を入力…',
          'Compose the message body…',
        ),
      }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[14rem] px-3 py-2 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      onChange({ html: editor.getHTML(), text: editor.getText() });
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
    };
  }, [editor, onChange]);

  if (!editor) {
    return <div className="rounded-md border min-h-[14rem]" />;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="flex items-center gap-1 border-b bg-muted/30 px-2 py-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <BoldIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <ItalicIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <ListIcon className="size-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
