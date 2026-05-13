import mammoth from 'mammoth';

export const MIN_USABLE_CHARS = 500;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

export type FileExtractionErrorCode =
  | 'file_too_large'
  | 'unsupported_mime'
  | 'extraction_failed';

export class FileExtractionError extends Error {
  code: FileExtractionErrorCode;
  constructor(code: FileExtractionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'FileExtractionError';
  }
}

export function validateFile(file: File): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new FileExtractionError(
      'file_too_large',
      `File exceeds 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    );
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMime)) {
    throw new FileExtractionError(
      'unsupported_mime',
      `Unsupported file type: ${file.type || 'unknown'}`,
    );
  }
}

export interface ExtractionResult {
  text: string;
  chars: number;
}

export async function extractTextFromFile(
  file: File,
): Promise<ExtractionResult> {
  if (file.type === 'text/plain') {
    const text = await file.text();
    return { text, chars: text.length };
  }

  if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { text: result.value, chars: result.value.length };
    } catch (e) {
      throw new FileExtractionError(
        'extraction_failed',
        `DOCX extraction failed: ${(e as Error).message}`,
      );
    }
  }

  if (file.type === 'application/pdf') {
    try {
      await import('./pdf-worker');
      const { getDocument } = await import('pdfjs-dist');
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await getDocument({ data }).promise;
      const pageTexts: string[] = [];
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        pageTexts.push(pageText);
      }
      const text = pageTexts.join('\n\n');
      return { text, chars: text.length };
    } catch (e) {
      throw new FileExtractionError(
        'extraction_failed',
        `PDF extraction failed: ${(e as Error).message}`,
      );
    }
  }

  throw new FileExtractionError(
    'unsupported_mime',
    `Cannot extract text from: ${file.type || 'unknown'}`,
  );
}
