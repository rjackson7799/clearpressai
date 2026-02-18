/**
 * ClearPress AI - Content Utilities
 * Converts between StructuredContent and HTML for the Tiptap editor
 */

import type { StructuredContent, ContentType } from '@/types';

// ===== Field Configuration Types =====

export type FieldType = 'text' | 'textarea' | 'paragraphs' | 'quotes' | 'sections';

export interface FieldConfig {
  key: keyof StructuredContent;
  type: FieldType;
  labelJa: string;
  labelEn: string;
}

// ===== Content Type Field Configurations =====

export const CONTENT_TYPE_FIELDS: Record<ContentType, FieldConfig[]> = {
  press_release: [
    { key: 'headline', type: 'text', labelJa: '見出し', labelEn: 'Headline' },
    { key: 'subheadline', type: 'text', labelJa: '副見出し', labelEn: 'Subheadline' },
    { key: 'dateline', type: 'text', labelJa: 'デートライン', labelEn: 'Dateline' },
    { key: 'lead', type: 'textarea', labelJa: 'リード文', labelEn: 'Lead' },
    { key: 'body', type: 'paragraphs', labelJa: '本文', labelEn: 'Body' },
    { key: 'quotes', type: 'quotes', labelJa: '引用', labelEn: 'Quotes' },
    { key: 'boilerplate', type: 'textarea', labelJa: 'ボイラープレート', labelEn: 'Boilerplate' },
    { key: 'isi', type: 'textarea', labelJa: '重要な安全性情報', labelEn: 'Important Safety Information' },
    { key: 'contact', type: 'textarea', labelJa: 'お問い合わせ先', labelEn: 'Contact' },
  ],
  blog_post: [
    { key: 'title', type: 'text', labelJa: 'タイトル', labelEn: 'Title' },
    { key: 'introduction', type: 'textarea', labelJa: 'イントロダクション', labelEn: 'Introduction' },
    { key: 'sections', type: 'sections', labelJa: 'セクション', labelEn: 'Sections' },
    { key: 'conclusion', type: 'textarea', labelJa: 'まとめ', labelEn: 'Conclusion' },
    { key: 'cta', type: 'textarea', labelJa: 'CTA', labelEn: 'Call to Action' },
  ],
  social_media: [
    { key: 'title', type: 'text', labelJa: 'タイトル', labelEn: 'Title' },
    { key: 'body', type: 'paragraphs', labelJa: '本文', labelEn: 'Body' },
  ],
  internal_memo: [
    { key: 'title', type: 'text', labelJa: 'タイトル', labelEn: 'Title' },
    { key: 'headline', type: 'text', labelJa: 'ヘッダー', labelEn: 'Header' },
    { key: 'lead', type: 'textarea', labelJa: '目的', labelEn: 'Purpose' },
    { key: 'body', type: 'paragraphs', labelJa: '本文', labelEn: 'Body' },
    { key: 'contact', type: 'textarea', labelJa: 'お問い合わせ先', labelEn: 'Contact' },
  ],
  faq: [
    { key: 'title', type: 'text', labelJa: 'タイトル', labelEn: 'Title' },
    { key: 'introduction', type: 'textarea', labelJa: 'イントロダクション', labelEn: 'Introduction' },
    { key: 'sections', type: 'sections', labelJa: 'Q&A', labelEn: 'Q&A' },
    { key: 'conclusion', type: 'textarea', labelJa: 'まとめ', labelEn: 'Conclusion' },
  ],
  executive_statement: [
    { key: 'title', type: 'text', labelJa: 'タイトル', labelEn: 'Title' },
    { key: 'lead', type: 'textarea', labelJa: '冒頭', labelEn: 'Opening' },
    { key: 'body', type: 'paragraphs', labelJa: '本文', labelEn: 'Body' },
    { key: 'conclusion', type: 'textarea', labelJa: 'まとめ', labelEn: 'Conclusion' },
  ],
};

/**
 * Check if content has structured fields (vs. only html/plain_text).
 */
export function hasStructuredFields(content: StructuredContent | null | undefined): boolean {
  if (!content) return false;
  return !!(
    content.headline ||
    content.subheadline ||
    content.dateline ||
    content.lead ||
    content.body?.length ||
    content.quotes?.length ||
    content.boilerplate ||
    content.isi ||
    content.contact ||
    content.title ||
    content.introduction ||
    content.sections?.length ||
    content.conclusion ||
    content.cta
  );
}

/**
 * Convert StructuredContent to plain text for compliance checks and search.
 */
export function structuredToPlainText(content: StructuredContent | null | undefined): string {
  if (!content) return '';
  if (content.plain_text) return content.plain_text;

  const parts: string[] = [];

  if (content.headline) parts.push(content.headline);
  if (content.subheadline) parts.push(content.subheadline);
  if (content.title) parts.push(content.title);
  if (content.dateline) parts.push(content.dateline);
  if (content.lead) parts.push(content.lead);
  if (content.introduction) parts.push(content.introduction);
  if (content.body) parts.push(...content.body);
  if (content.sections) {
    content.sections.forEach((s) => {
      parts.push(s.heading);
      parts.push(s.content);
    });
  }
  if (content.quotes) {
    content.quotes.forEach((q) => {
      parts.push(`「${q.text}」— ${q.attribution}`);
    });
  }
  if (content.conclusion) parts.push(content.conclusion);
  if (content.cta) parts.push(content.cta);
  if (content.isi) parts.push(content.isi);
  if (content.boilerplate) parts.push(content.boilerplate);
  if (content.contact) parts.push(content.contact);

  return parts.join('\n\n');
}

/**
 * Convert StructuredContent to Tiptap-compatible HTML.
 *
 * Handles all content formats stored in content_versions.content:
 * - Structured fields (headline, body[], quotes[], sections[], etc.)
 * - HTML pass-through (content.html)
 * - Plain text fallback (content.plain_text)
 * - Empty/null content
 *
 * Content type field mapping:
 * - Press release: headline, subheadline, dateline, lead, body[], quotes[], boilerplate, isi, contact
 * - Blog post: title, introduction, sections[{heading, content}], conclusion, cta
 * - Social media: title, body[]
 * - Internal memo: title, headline (header), lead (purpose), body[], contact
 * - FAQ: title, introduction, sections[{heading=question, content=answer}], conclusion
 * - Executive statement: title, lead (opening), body[], conclusion
 */
export function structuredContentToHtml(content: StructuredContent | null | undefined): string {
  if (!content) return '';

  // If structured fields exist, convert them to HTML
  if (hasStructuredFields(content)) {
    return structuredFieldsToHtml(content);
  }

  // Fall back to html field
  if (content.html) {
    return content.html;
  }

  // Fall back to plain_text
  if (content.plain_text) {
    return plainTextToHtml(content.plain_text);
  }

  return '';
}

/**
 * Convert structured content fields to HTML.
 * Produces semantic HTML that Tiptap can parse and render correctly.
 */
function structuredFieldsToHtml(content: StructuredContent): string {
  const parts: string[] = [];

  // Headline (press release) or Title (blog/other)
  if (content.headline) {
    parts.push(`<h1>${escapeHtml(content.headline)}</h1>`);
  } else if (content.title) {
    parts.push(`<h1>${escapeHtml(content.title)}</h1>`);
  }

  // Subheadline
  if (content.subheadline) {
    parts.push(`<h2>${escapeHtml(content.subheadline)}</h2>`);
  }

  // Dateline
  if (content.dateline) {
    parts.push(`<p><em>${escapeHtml(content.dateline)}</em></p>`);
  }

  // Lead paragraph
  if (content.lead) {
    parts.push(`<p><strong>${escapeHtml(content.lead)}</strong></p>`);
  }

  // Introduction (blog/FAQ)
  if (content.introduction) {
    parts.push(`<p>${escapeHtml(content.introduction)}</p>`);
  }

  // Body paragraphs
  if (content.body && content.body.length > 0) {
    for (const paragraph of content.body) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
  }

  // Sections (blog/FAQ — heading + content pairs)
  if (content.sections && content.sections.length > 0) {
    for (const section of content.sections) {
      parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
      parts.push(`<p>${escapeHtml(section.content)}</p>`);
    }
  }

  // Quotes
  if (content.quotes && content.quotes.length > 0) {
    for (const quote of content.quotes) {
      parts.push(
        `<blockquote><p>\u300C${escapeHtml(quote.text)}\u300D</p>` +
        `<p>\u2014 ${escapeHtml(quote.attribution)}</p></blockquote>`
      );
    }
  }

  // Conclusion
  if (content.conclusion) {
    parts.push(`<p>${escapeHtml(content.conclusion)}</p>`);
  }

  // CTA (call to action)
  if (content.cta) {
    parts.push(`<p><strong>${escapeHtml(content.cta)}</strong></p>`);
  }

  // ISI (Important Safety Information)
  if (content.isi) {
    parts.push(
      `<hr>` +
      `<h3>\u91CD\u8981\u306A\u5B89\u5168\u6027\u60C5\u5831</h3>` +
      `<p>${escapeHtml(content.isi)}</p>`
    );
  }

  // Boilerplate
  if (content.boilerplate) {
    parts.push(
      `<hr>` +
      `<h3>\u4F1A\u793E\u6982\u8981</h3>` +
      `<p>${escapeHtml(content.boilerplate)}</p>`
    );
  }

  // Contact
  if (content.contact) {
    parts.push(
      `<p><strong>\u304A\u554F\u3044\u5408\u308F\u305B\u5148:</strong> ${escapeHtml(content.contact)}</p>`
    );
  }

  return parts.join('');
}

/**
 * Convert plain text to HTML by wrapping lines in <p> tags.
 */
function plainTextToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .filter((block) => block.trim())
    .map((block) => `<p>${escapeHtml(block.trim())}</p>`)
    .join('');
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
