/**
 * ClearPress AI - Export Types
 * Types and interfaces for content export functionality
 */

import type { ContentType, StructuredContent, ComplianceDetails } from './index';

// ===== Export Format Types =====

export type ExportFormat = 'pdf' | 'docx' | 'txt';
export type PaperSize = 'a4' | 'letter';

// ===== Export Options =====

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeComplianceScore: boolean;
  language: 'ja' | 'en';
  paperSize: PaperSize;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  includeMetadata: true,
  includeComplianceScore: false,
  language: 'ja',
  paperSize: 'a4',
};

// ===== Export Content Data =====

export interface ExportContentData {
  // Content metadata
  title: string;
  contentType: ContentType;
  versionNumber: number;
  wordCount: number;

  // Content
  content: StructuredContent;

  // Optional metadata
  projectName?: string;
  clientName?: string;
  createdAt: string;
  createdBy?: string;

  // Compliance
  complianceScore?: number;
  complianceDetails?: ComplianceDetails;
}

// ===== Export Result =====

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

// ===== MIME Types =====

export const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

// ===== File Extensions =====

export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: '.pdf',
  docx: '.docx',
  txt: '.txt',
};

// ===== Paper Dimensions (in points for PDF) =====

export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

// ===== Content Type Labels (for export headers) =====

export const CONTENT_TYPE_LABELS: Record<ContentType, { ja: string; en: string }> = {
  press_release: { ja: 'プレスリリース', en: 'Press Release' },
  blog_post: { ja: 'ブログ記事', en: 'Blog Post' },
  social_media: { ja: 'ソーシャルメディア', en: 'Social Media' },
  internal_memo: { ja: '社内文書', en: 'Internal Memo' },
  faq: { ja: 'FAQ', en: 'FAQ' },
  executive_statement: { ja: '経営者声明', en: 'Executive Statement' },
};

// ===== PDF Styling Constants =====

export const PDF_STYLES = {
  // Fonts
  fonts: {
    primary: 'NotoSansJP',
    fallback: 'Helvetica',
  },
  // Font sizes (in points)
  fontSize: {
    title: 18,
    headline: 16,
    subheadline: 14,
    body: 11,
    small: 9,
    footer: 8,
  },
  // Spacing (in points)
  spacing: {
    margin: 50,
    paragraphGap: 12,
    sectionGap: 24,
    lineHeight: 1.6,
  },
  // Colors
  colors: {
    text: '#1a1a1a',
    muted: '#6b7280',
    border: '#e5e7eb',
    isi: {
      background: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
    },
    boilerplate: {
      background: '#f3f4f6',
      border: '#d1d5db',
    },
    compliance: {
      high: '#22c55e',
      medium: '#f59e0b',
      low: '#ef4444',
    },
  },
} as const;

// ===== DOCX Styling Constants =====

export const DOCX_STYLES = {
  fonts: {
    primary: 'Yu Gothic',
    fallback: 'Arial',
  },
  fontSize: {
    title: 28, // Half-points (14pt)
    headline: 24,
    subheadline: 22,
    body: 22, // 11pt
    small: 18,
    footer: 16,
  },
  spacing: {
    paragraphAfter: 200, // Twips (1/20 of a point)
    sectionAfter: 400,
  },
} as const;
