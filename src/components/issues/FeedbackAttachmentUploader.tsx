import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { BilingualLabel } from "@/components/shared/BilingualLabel";

const IMAGE_MIME = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface Item {
  id: string;
  file: File;
  url: string;
}

interface Props {
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FeedbackAttachmentUploader({ onChange, disabled }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Revoke object URLs on unmount (the dialog unmounts this on close).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    },
    [],
  );

  const emit = (next: Item[]) => {
    setItems(next);
    onChange(next.map((i) => i.file));
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: Item[] = [];
    for (const file of Array.from(files)) {
      if (!IMAGE_MIME.includes(file.type)) {
        toast.error(t("internalFeedback.errors.unsupportedImage"));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t("internalFeedback.errors.fileTooLarge"));
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (accepted.length > 0) emit([...items, ...accepted]);
  };

  const remove = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.url);
    emit(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors " +
          (disabled ? "pointer-events-none opacity-50 " : "") +
          (dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-muted-foreground/50")
        }
      >
        <ImagePlusIcon className="mb-2 size-6 text-muted-foreground" />
        <p className="text-sm">
          <BilingualLabel
            ja="スクリーンショットを追加"
            en="Add screenshots"
          />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <BilingualLabel
            ja="PNG / JPEG / GIF / WebP（各5MB以下）"
            en="PNG / JPEG / GIF / WebP (max 5 MB each)"
          />
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <img
                src={item.url}
                alt={item.file.name}
                className="size-20 rounded-md border object-cover"
              />
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() => remove(item.id)}
                className="absolute -right-2 -top-2 rounded-full border bg-background p-0.5 shadow-sm hover:bg-muted"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
