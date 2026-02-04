/**
 * ClearPress AI - DOCX Generator
 * Generate Word documents from structured content
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from 'docx';

import type { ExportContentData, ExportOptions, ExportResult } from '@/types/export';
import { EXPORT_MIME_TYPES, DOCX_STYLES, CONTENT_TYPE_LABELS } from '@/types/export';
import { generateExportFilename, htmlToPlainText, formatExportDate } from './export-utils';

/**
 * Create a styled paragraph
 */
function createParagraph(
  text: string,
  options: {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    spacing?: { before?: number; after?: number };
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {}
): Paragraph {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: options.spacing,
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italic,
        size: options.size || DOCX_STYLES.fontSize.body,
        color: options.color,
        font: DOCX_STYLES.fonts.primary,
      }),
    ],
  });
}

/**
 * Create an ISI block (Important Safety Information)
 */
function createISIBlock(isi: string, language: 'ja' | 'en'): Table {
  const headerText = language === 'ja' ? '重要な安全性情報' : 'IMPORTANT SAFETY INFORMATION';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'F59E0B' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'F59E0B' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'F59E0B' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'F59E0B' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
            children: [
              createParagraph(headerText, {
                bold: true,
                size: DOCX_STYLES.fontSize.subheadline,
                color: '92400E',
                spacing: { after: 100 },
              }),
              createParagraph(htmlToPlainText(isi), {
                size: DOCX_STYLES.fontSize.small,
                color: '92400E',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Create a boilerplate block
 */
function createBoilerplateBlock(boilerplate: string, language: 'ja' | 'en'): Table {
  const headerText = language === 'ja' ? '会社概要' : 'About';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
            children: [
              createParagraph(headerText, {
                bold: true,
                size: DOCX_STYLES.fontSize.subheadline,
                spacing: { after: 100 },
              }),
              createParagraph(htmlToPlainText(boilerplate), {
                size: DOCX_STYLES.fontSize.small,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Create a quote block
 */
function createQuoteBlock(text: string, attribution: string): Paragraph[] {
  return [
    new Paragraph({
      indent: { left: 720, right: 720 }, // 0.5 inch indent
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: `"${text}"`,
          italics: true,
          size: DOCX_STYLES.fontSize.body,
          font: DOCX_STYLES.fonts.primary,
        }),
      ],
    }),
    new Paragraph({
      indent: { left: 720, right: 720 },
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `— ${attribution}`,
          size: DOCX_STYLES.fontSize.small,
          font: DOCX_STYLES.fonts.primary,
        }),
      ],
    }),
  ];
}

/**
 * Build document content from structured content
 */
function buildDocumentContent(
  data: ExportContentData,
  options: ExportOptions
): (Paragraph | Table)[] {
  const content: (Paragraph | Table)[] = [];
  const { content: structuredContent, contentType } = data;

  // Document title
  content.push(
    createParagraph(data.title, {
      heading: HeadingLevel.TITLE,
      bold: true,
      size: DOCX_STYLES.fontSize.title,
      spacing: { after: 200 },
    })
  );

  // Content type label
  content.push(
    createParagraph(CONTENT_TYPE_LABELS[contentType][options.language], {
      size: DOCX_STYLES.fontSize.small,
      color: '6B7280',
      spacing: { after: 400 },
    })
  );

  // Metadata
  if (options.includeMetadata) {
    const metadataLines: string[] = [];
    if (data.projectName) {
      metadataLines.push(
        `${options.language === 'ja' ? 'プロジェクト' : 'Project'}: ${data.projectName}`
      );
    }
    if (data.clientName) {
      metadataLines.push(
        `${options.language === 'ja' ? 'クライアント' : 'Client'}: ${data.clientName}`
      );
    }
    metadataLines.push(
      `${options.language === 'ja' ? 'バージョン' : 'Version'}: ${data.versionNumber}`
    );
    metadataLines.push(
      `${options.language === 'ja' ? '文字数' : 'Word Count'}: ${data.wordCount}`
    );
    metadataLines.push(
      `${options.language === 'ja' ? '作成日' : 'Created'}: ${formatExportDate(data.createdAt, options.language)}`
    );

    if (options.includeComplianceScore && data.complianceScore !== undefined) {
      metadataLines.push(
        `${options.language === 'ja' ? 'コンプライアンススコア' : 'Compliance Score'}: ${data.complianceScore}%`
      );
    }

    metadataLines.forEach((line) => {
      content.push(
        createParagraph(line, {
          size: DOCX_STYLES.fontSize.small,
          color: '6B7280',
          spacing: { after: 50 },
        })
      );
    });

    // Separator
    content.push(
      new Paragraph({
        spacing: { before: 200, after: 400 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        },
        children: [],
      })
    );
  }

  // Headline
  if (structuredContent.headline) {
    content.push(
      createParagraph(structuredContent.headline, {
        heading: HeadingLevel.HEADING_1,
        bold: true,
        size: DOCX_STYLES.fontSize.headline,
        spacing: { after: 200 },
      })
    );
  }

  // Subheadline
  if (structuredContent.subheadline) {
    content.push(
      createParagraph(structuredContent.subheadline, {
        heading: HeadingLevel.HEADING_2,
        size: DOCX_STYLES.fontSize.subheadline,
        color: '4B5563',
        spacing: { after: 200 },
      })
    );
  }

  // Dateline
  if (structuredContent.dateline) {
    content.push(
      createParagraph(structuredContent.dateline, {
        bold: true,
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: 200 },
      })
    );
  }

  // Lead
  if (structuredContent.lead) {
    content.push(
      createParagraph(structuredContent.lead, {
        bold: true,
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // Introduction
  if (structuredContent.introduction) {
    content.push(
      createParagraph(htmlToPlainText(structuredContent.introduction), {
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // Body paragraphs
  if (structuredContent.body && structuredContent.body.length > 0) {
    structuredContent.body.forEach((paragraph) => {
      content.push(
        createParagraph(htmlToPlainText(paragraph), {
          size: DOCX_STYLES.fontSize.body,
          spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
        })
      );
    });
  }

  // Raw HTML content
  if (structuredContent.html && (!structuredContent.body || structuredContent.body.length === 0)) {
    content.push(
      createParagraph(htmlToPlainText(structuredContent.html), {
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // Sections (for blog posts, etc.)
  if (structuredContent.sections && structuredContent.sections.length > 0) {
    structuredContent.sections.forEach((section) => {
      if (section.heading) {
        content.push(
          createParagraph(section.heading, {
            heading: HeadingLevel.HEADING_2,
            bold: true,
            size: DOCX_STYLES.fontSize.subheadline,
            spacing: { before: DOCX_STYLES.spacing.sectionAfter, after: 200 },
          })
        );
      }
      content.push(
        createParagraph(htmlToPlainText(section.content), {
          size: DOCX_STYLES.fontSize.body,
          spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
        })
      );
    });
  }

  // Quotes
  if (structuredContent.quotes && structuredContent.quotes.length > 0) {
    structuredContent.quotes.forEach((quote) => {
      content.push(...createQuoteBlock(quote.text, quote.attribution));
    });
  }

  // Conclusion
  if (structuredContent.conclusion) {
    content.push(
      createParagraph(htmlToPlainText(structuredContent.conclusion), {
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // CTA
  if (structuredContent.cta) {
    content.push(
      createParagraph(htmlToPlainText(structuredContent.cta), {
        bold: true,
        size: DOCX_STYLES.fontSize.body,
        spacing: { before: 200, after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // Contact info
  if (structuredContent.contact) {
    content.push(
      new Paragraph({
        spacing: { before: DOCX_STYLES.spacing.sectionAfter },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        },
        children: [],
      })
    );
    content.push(
      createParagraph(
        options.language === 'ja' ? 'お問い合わせ' : 'Contact',
        {
          bold: true,
          size: DOCX_STYLES.fontSize.subheadline,
          spacing: { before: 200, after: 100 },
        }
      )
    );
    content.push(
      createParagraph(structuredContent.contact, {
        size: DOCX_STYLES.fontSize.body,
        spacing: { after: DOCX_STYLES.spacing.paragraphAfter },
      })
    );
  }

  // ISI (Important Safety Information)
  if (structuredContent.isi) {
    content.push(
      new Paragraph({
        spacing: { before: DOCX_STYLES.spacing.sectionAfter, after: 200 },
        children: [],
      })
    );
    content.push(createISIBlock(structuredContent.isi, options.language));
  }

  // Boilerplate
  if (structuredContent.boilerplate) {
    content.push(
      new Paragraph({
        spacing: { before: DOCX_STYLES.spacing.sectionAfter, after: 200 },
        children: [],
      })
    );
    content.push(createBoilerplateBlock(structuredContent.boilerplate, options.language));
  }

  return content;
}

/**
 * Generate DOCX export
 */
export async function generateDOCXExport(
  data: ExportContentData,
  options: ExportOptions
): Promise<ExportResult> {
  const documentContent = buildDocumentContent(data, options);

  // Create document
  const doc = new Document({
    creator: 'ClearPress AI',
    title: data.title,
    description: `${CONTENT_TYPE_LABELS[data.contentType][options.language]} - ${data.title}`,
    sections: [
      {
        properties: {
          page: {
            size: {
              // A4 or Letter in twips (1/20 of a point, 1440 twips = 1 inch)
              width: options.paperSize === 'a4' ? 11906 : 12240,
              height: options.paperSize === 'a4' ? 16838 : 15840,
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'ClearPress AI',
                    size: DOCX_STYLES.fontSize.footer,
                    color: '9CA3AF',
                    font: DOCX_STYLES.fonts.fallback,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: DOCX_STYLES.fontSize.footer,
                    color: '9CA3AF',
                    font: DOCX_STYLES.fonts.fallback,
                  }),
                  new TextRun({
                    text: ' / ',
                    size: DOCX_STYLES.fontSize.footer,
                    color: '9CA3AF',
                    font: DOCX_STYLES.fonts.fallback,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: DOCX_STYLES.fontSize.footer,
                    color: '9CA3AF',
                    font: DOCX_STYLES.fonts.fallback,
                  }),
                ],
              }),
            ],
          }),
        },
        children: documentContent,
      },
    ],
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  const filename = generateExportFilename(data.title, 'docx', options.language);

  return {
    blob,
    filename,
    mimeType: EXPORT_MIME_TYPES.docx,
  };
}
