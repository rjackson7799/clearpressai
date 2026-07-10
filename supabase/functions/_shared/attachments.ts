/**
 * Attachment generation for delivery emails.
 *
 *   PDF: pdfshift.io (HTML → PDF, ~2-5s; $0.005/conversion).
 *   DOCX: docx npm package, in-Function generation.
 *
 * Size caps:
 *   - Each attachment ≤ 5 MB.
 *   - Total payload ≤ 9 MB (Resend hard limit is 40 MB but most receiving
 *     servers cap below 10 MB).
 *
 * Filename sanitization: collapse non-alphanumeric to '_', strip leading
 * dots, cap at 80 chars. Defense against path traversal + shell metachars
 * if the recipient's mail client ever exposes the filename.
 *
 * Partial-success rejection: when attachment_format='both', generatePdf and
 * generateDocx are awaited together via Promise.allSettled at the caller;
 * if either rejects, the caller aborts the whole send (mark_delivery_failed).
 * No half-formatted deliveries.
 */
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from 'docx';
import type { DocMeta, PdfOptions } from './doc-rendering.ts';
import {
  buildPdfConvertBody,
  DRAFT_BANNER_TEXT,
  buildPdfFooterText,
} from './doc-rendering.ts';

export type AttachmentWhich = 'pdf' | 'docx';

export class AttachmentError extends Error {
  constructor(public which: AttachmentWhich, message: string) {
    super(message);
    this.name = 'AttachmentError';
  }
}

export interface Attachment {
  filename: string;
  contentType: string;
  content: string;
  size_bytes: number;
}

const MAX_SINGLE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;

export function sanitizeFilename(name: string): string {
  return name
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80) || 'attachment';
}

export async function generatePdf(
  html: string,
  filename: string,
  opts: PdfOptions = {},
): Promise<Attachment> {
  const apiKey = normalizeSecret(Deno.env.get('PDFSHIFT_API_KEY'));
  if (!apiKey) {
    throw new AttachmentError('pdf', 'PDFSHIFT_API_KEY not set');
  }
  const res = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPdfConvertBody(html, opts)),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new AttachmentError('pdf', `pdfshift ${res.status}: ${errText}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_SINGLE_BYTES) {
    throw new AttachmentError(
      'pdf',
      `pdf size ${buf.byteLength} exceeds ${MAX_SINGLE_BYTES}`,
    );
  }
  return {
    filename: sanitizeFilename(filename),
    contentType: 'application/pdf',
    content: bufToBase64(buf),
    size_bytes: buf.byteLength,
  };
}

export interface VariantBlock {
  variant_label: string;
  variant_index: number;
  body_text: string;
}

export async function generateDocx(
  blocks: ReadonlyArray<VariantBlock>,
  filename: string,
  meta: DocMeta,
): Promise<Attachment> {
  const sorted = blocks.slice().sort((a, b) => a.variant_index - b.variant_index);
  const children = sorted.flatMap((b) => [
    new Paragraph({
      text: `Variant ${b.variant_index} — ${b.variant_label}`,
      heading: HeadingLevel.HEADING_2,
    }),
    ...b.body_text.split(/\n\n+/).map(
      (p) => new Paragraph({ children: [new TextRun(p)] }),
    ),
  ]);
  const headerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: {
      type: ShadingType.CLEAR,
      color: 'auto',
      fill: 'EA580C',
    },
    children: [
      new TextRun({
        text: DRAFT_BANNER_TEXT,
        bold: true,
        color: 'FFFFFF',
        size: 22,
      }),
    ],
  });
  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: buildPdfFooterText(meta),
        color: '6B7280',
        size: 16,
      }),
    ],
  });
  const doc = new Document({
    sections: [{
      headers: { default: new Header({ children: [headerParagraph] }) },
      footers: { default: new Footer({ children: [footerParagraph] }) },
      children,
    }],
  });
  let buf: Uint8Array;
  try {
    const out = await Packer.toBuffer(doc);
    buf = new Uint8Array(out);
  } catch (err) {
    throw new AttachmentError(
      'docx',
      `docx pack failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (buf.byteLength > MAX_SINGLE_BYTES) {
    throw new AttachmentError(
      'docx',
      `docx size ${buf.byteLength} exceeds ${MAX_SINGLE_BYTES}`,
    );
  }
  return {
    filename: sanitizeFilename(filename),
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: bufToBase64(buf),
    size_bytes: buf.byteLength,
  };
}

export function assertTotalSize(attachments: ReadonlyArray<Attachment>): void {
  const total = attachments.reduce((s, a) => s + a.size_bytes, 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new AttachmentError(
      'pdf',
      `total attachment size ${total} exceeds ${MAX_TOTAL_BYTES}`,
    );
  }
}

function bufToBase64(buf: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

function normalizeSecret(value: string | undefined): string | undefined {
  return value?.trim().replace(/^['"]|['"]$/g, '');
}
