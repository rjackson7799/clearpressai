/**
 * ClearPress AI - Export Utilities
 * Helper functions for content export
 */

import type { StructuredContent, ContentType } from '@/types';
import type {
  ExportOptions,
  ExportContentData,
  ExportResult,
  ExportFormat,
} from '@/types/export';
import {
  EXPORT_MIME_TYPES,
  EXPORT_EXTENSIONS,
  CONTENT_TYPE_LABELS,
} from '@/types/export';

/**
 * Generate a filename for the export
 */
export function generateExportFilename(
  title: string,
  format: ExportFormat,
  _language: 'ja' | 'en'
): string {
  // Sanitize title for filename
  // Note: _language is passed for future localized date formats
  const sanitized = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length

  // Get date string
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Extension
  const ext = EXPORT_EXTENSIONS[format];

  return `${sanitized}_${dateStr}${ext}`;
}

/**
 * Get content type label in the specified language
 */
export function getContentTypeLabel(
  contentType: ContentType,
  language: 'ja' | 'en'
): string {
  return CONTENT_TYPE_LABELS[contentType][language];
}

/**
 * Convert HTML to plain text
 */
export function htmlToPlainText(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Replace common block elements with newlines
  const blockTags = ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'];
  blockTags.forEach((tag) => {
    const elements = temp.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (tag === 'br') {
        el.replaceWith('\n');
      } else if (tag === 'li') {
        el.insertAdjacentText('afterbegin', '• ');
        el.insertAdjacentText('beforeend', '\n');
      } else {
        el.insertAdjacentText('beforeend', '\n\n');
      }
    }
  });

  // Get text content and clean up
  let text = temp.textContent || '';

  // Normalize whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/[ \t]+/g, ' ') // Single spaces
    .trim();

  return text;
}

/**
 * Convert StructuredContent to plain text
 */
export function structuredContentToPlainText(
  content: StructuredContent,
  contentType: ContentType,
  language: 'ja' | 'en'
): string {
  const lines: string[] = [];
  const divider = '─'.repeat(40);

  // Add content type header
  lines.push(getContentTypeLabel(contentType, language).toUpperCase());
  lines.push(divider);
  lines.push('');

  // Headline
  if (content.headline) {
    lines.push(content.headline);
    lines.push('');
  }

  // Subheadline
  if (content.subheadline) {
    lines.push(content.subheadline);
    lines.push('');
  }

  // Dateline
  if (content.dateline) {
    lines.push(content.dateline);
    lines.push('');
  }

  // Lead
  if (content.lead) {
    lines.push(content.lead);
    lines.push('');
  }

  // Body paragraphs
  if (content.body && content.body.length > 0) {
    content.body.forEach((paragraph) => {
      lines.push(htmlToPlainText(paragraph));
      lines.push('');
    });
  }

  // Or raw HTML
  if (content.html && (!content.body || content.body.length === 0)) {
    lines.push(htmlToPlainText(content.html));
    lines.push('');
  }

  // Sections (for blog posts, etc.)
  if (content.sections && content.sections.length > 0) {
    content.sections.forEach((section) => {
      if (section.heading) {
        lines.push(`## ${section.heading}`);
      }
      lines.push(htmlToPlainText(section.content));
      lines.push('');
    });
  }

  // Quotes
  if (content.quotes && content.quotes.length > 0) {
    content.quotes.forEach((quote) => {
      lines.push(`"${quote.text}"`);
      lines.push(`— ${quote.attribution}`);
      lines.push('');
    });
  }

  // Conclusion
  if (content.conclusion) {
    lines.push(htmlToPlainText(content.conclusion));
    lines.push('');
  }

  // CTA
  if (content.cta) {
    lines.push(htmlToPlainText(content.cta));
    lines.push('');
  }

  // Contact info
  if (content.contact) {
    lines.push(divider);
    lines.push(language === 'ja' ? 'お問い合わせ:' : 'Contact:');
    lines.push(content.contact);
    lines.push('');
  }

  // ISI (Important Safety Information)
  if (content.isi) {
    lines.push(divider);
    lines.push(
      language === 'ja' ? '【重要な安全性情報】' : '【IMPORTANT SAFETY INFORMATION】'
    );
    lines.push(htmlToPlainText(content.isi));
    lines.push('');
  }

  // Boilerplate
  if (content.boilerplate) {
    lines.push(divider);
    lines.push(language === 'ja' ? '会社概要:' : 'About:');
    lines.push(htmlToPlainText(content.boilerplate));
  }

  return lines.join('\n').trim();
}

/**
 * Generate plain text export
 */
export function generatePlainTextExport(
  data: ExportContentData,
  options: ExportOptions
): ExportResult {
  const lines: string[] = [];

  // Title
  lines.push(data.title);
  lines.push('='.repeat(Math.min(data.title.length, 60)));
  lines.push('');

  // Metadata (if included)
  if (options.includeMetadata) {
    if (data.projectName) {
      lines.push(
        `${options.language === 'ja' ? 'プロジェクト' : 'Project'}: ${data.projectName}`
      );
    }
    if (data.clientName) {
      lines.push(
        `${options.language === 'ja' ? 'クライアント' : 'Client'}: ${data.clientName}`
      );
    }
    lines.push(
      `${options.language === 'ja' ? 'バージョン' : 'Version'}: ${data.versionNumber}`
    );
    lines.push(
      `${options.language === 'ja' ? '文字数' : 'Word Count'}: ${data.wordCount}`
    );
    const dateLabel = options.language === 'ja' ? '作成日' : 'Created';
    lines.push(`${dateLabel}: ${new Date(data.createdAt).toLocaleDateString(
      options.language === 'ja' ? 'ja-JP' : 'en-US'
    )}`);

    if (options.includeComplianceScore && data.complianceScore !== undefined) {
      lines.push(
        `${options.language === 'ja' ? 'コンプライアンススコア' : 'Compliance Score'}: ${data.complianceScore}%`
      );
    }
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }

  // Main content
  const textContent = structuredContentToPlainText(
    data.content,
    data.contentType,
    options.language
  );
  lines.push(textContent);

  // Create blob
  const text = lines.join('\n');
  const blob = new Blob([text], { type: EXPORT_MIME_TYPES.txt });
  const filename = generateExportFilename(data.title, 'txt', options.language);

  return {
    blob,
    filename,
    mimeType: EXPORT_MIME_TYPES.txt,
  };
}

/**
 * Trigger file download in browser
 */
export function downloadFile(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatExportDate(dateString: string, language: 'ja' | 'en'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get compliance score color class
 */
export function getComplianceScoreColor(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}
