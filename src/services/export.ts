/**
 * ClearPress AI - Export Service
 * Orchestrates content export to various formats
 */

import { pdf } from '@react-pdf/renderer';
import type { ContentItem, ContentVersion, Project } from '@/types';
import type {
  ExportOptions,
  ExportContentData,
  ExportResult,
} from '@/types/export';
import { generatePlainTextExport, downloadFile } from '@/lib/export-utils';
import { generateDOCXExport } from '@/lib/docx-generator';
import { PDFDocument } from '@/components/export/PDFDocument';

/**
 * Prepare export data from content item and version
 */
export function prepareExportData(
  contentItem: ContentItem,
  version: ContentVersion,
  project?: Project
): ExportContentData {
  return {
    title: contentItem.title,
    contentType: contentItem.type,
    versionNumber: version.version_number,
    wordCount: version.word_count,
    content: version.content,
    projectName: project?.name,
    clientName: project?.client?.name,
    createdAt: version.created_at,
    createdBy: version.created_by,
    complianceScore: version.compliance_score,
    complianceDetails: version.compliance_details,
  };
}

/**
 * Generate PDF export
 */
async function generatePDFExport(
  data: ExportContentData,
  options: ExportOptions
): Promise<ExportResult> {
  // Create PDF document element
  const documentElement = PDFDocument({ data, options });

  // Generate blob
  const blob = await pdf(documentElement).toBlob();

  // Generate filename
  const sanitizedTitle = data.title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${sanitizedTitle}_${dateStr}.pdf`;

  return {
    blob,
    filename,
    mimeType: 'application/pdf',
  };
}

/**
 * Export content to specified format
 */
export async function exportContent(
  contentItem: ContentItem,
  version: ContentVersion,
  options: ExportOptions,
  project?: Project
): Promise<void> {
  // Prepare export data
  const data = prepareExportData(contentItem, version, project);

  let result: ExportResult;

  // Generate export based on format
  switch (options.format) {
    case 'pdf':
      result = await generatePDFExport(data, options);
      break;
    case 'docx':
      result = await generateDOCXExport(data, options);
      break;
    case 'txt':
      result = generatePlainTextExport(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  // Trigger download
  downloadFile(result);
}

/**
 * Export content with custom HTML content (from editor)
 */
export async function exportContentFromEditor(
  title: string,
  contentType: ContentItem['type'],
  html: string,
  plainText: string,
  options: ExportOptions,
  metadata?: {
    projectName?: string;
    clientName?: string;
    versionNumber?: number;
    wordCount?: number;
    complianceScore?: number;
  }
): Promise<void> {
  // Build export data from editor content
  const data: ExportContentData = {
    title,
    contentType,
    versionNumber: metadata?.versionNumber ?? 1,
    wordCount: metadata?.wordCount ?? plainText.split(/\s+/).length,
    content: {
      html,
      plain_text: plainText,
    },
    projectName: metadata?.projectName,
    clientName: metadata?.clientName,
    createdAt: new Date().toISOString(),
    complianceScore: metadata?.complianceScore,
  };

  let result: ExportResult;

  // Generate export based on format
  switch (options.format) {
    case 'pdf':
      result = await generatePDFExport(data, options);
      break;
    case 'docx':
      result = await generateDOCXExport(data, options);
      break;
    case 'txt':
      result = generatePlainTextExport(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  // Trigger download
  downloadFile(result);
}
