import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UploadCloudIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { useUploadSample } from "@/hooks/useBrandVoiceSamples";
import {
  FileExtractionError,
  MIN_USABLE_CHARS,
  extractTextFromFile,
  validateFile,
} from "@/lib/utils/file-extraction";

type RowStatus = "pending" | "extracting" | "uploading" | "done" | "low_text" | "error";

interface Row {
  id: string;
  filename: string;
  status: RowStatus;
  chars?: number;
  errorCode?: string;
  errorMessage?: string;
}

interface Props {
  clientId: string;
}

export function SampleUploader({ clientId }: Props) {
  const { t } = useTranslation();
  const uploadSample = useUploadSample(clientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((curr) => curr.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const processFile = async (row: Row, file: File) => {
    try {
      validateFile(file);
    } catch (e) {
      const err = e as FileExtractionError;
      updateRow(row.id, {
        status: "error",
        errorCode: err.code,
        errorMessage: err.message,
      });
      toast.error(
        t(`brandVoice.uploadErrors.${err.code}`, { defaultValue: err.message }),
      );
      return;
    }

    updateRow(row.id, { status: "extracting" });
    let extracted;
    try {
      extracted = await extractTextFromFile(file);
    } catch (e) {
      const err = e as FileExtractionError;
      updateRow(row.id, {
        status: "error",
        errorCode: err.code ?? "extraction_failed",
        errorMessage: err.message,
      });
      toast.error(
        t(`brandVoice.uploadErrors.${err.code ?? "extraction_failed"}`, {
          defaultValue: err.message,
        }),
      );
      return;
    }

    updateRow(row.id, { status: "uploading", chars: extracted.chars });

    try {
      await uploadSample.mutateAsync({ file });
      const lowText = extracted.chars < MIN_USABLE_CHARS;
      updateRow(row.id, {
        status: lowText ? "low_text" : "done",
        chars: extracted.chars,
      });
    } catch (e) {
      const message = (e as Error).message;
      updateRow(row.id, {
        status: "error",
        errorCode: "upload_failed",
        errorMessage: message,
      });
      toast.error(t("brandVoice.uploadErrors.upload_failed"));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const fileArray = Array.from(files);
    const newRows: Row[] = fileArray.map((f) => ({
      id: crypto.randomUUID(),
      filename: f.name,
      status: "pending",
    }));
    setRows((curr) => [...newRows, ...curr]);
    for (let i = 0; i < fileArray.length; i++) {
      await processFile(newRows[i], fileArray[i]);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors " +
          (dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-muted-foreground/50")
        }
      >
        <UploadCloudIcon className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm">
          <BilingualLabel
            ja="ファイルをアップロード"
            en="Upload files"
          />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("brandVoice.dragDropHint")}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {rows.length > 0 && (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1 truncate">{row.filename}</div>
              <StatusBadge row={row} />
              {row.status === "error" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() =>
                    setRows((curr) => curr.filter((r) => r.id !== row.id))
                  }
                >
                  ×
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {busy ? t("common.loading") : null}
      </p>
    </div>
  );
}

function StatusBadge({ row }: { row: Row }) {
  const { t } = useTranslation();
  switch (row.status) {
    case "pending":
      return <Badge variant="outline">{t("brandVoice.uploadStatus.pending")}</Badge>;
    case "extracting":
      return <Badge variant="outline">{t("brandVoice.uploadStatus.extracting")}</Badge>;
    case "uploading":
      return <Badge variant="outline">{t("brandVoice.uploadStatus.uploading")}</Badge>;
    case "done":
      return <Badge variant="secondary">{t("brandVoice.uploadStatus.done")}</Badge>;
    case "low_text":
      return (
        <Badge className="bg-yellow-100 text-yellow-900 hover:bg-yellow-100">
          {t("brandVoice.lowTextWarning")}
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" title={row.errorMessage}>
          {row.errorCode
            ? t(`brandVoice.uploadErrors.${row.errorCode}`, {
                defaultValue: row.errorMessage ?? "error",
              })
            : t("common.error")}
        </Badge>
      );
  }
}
