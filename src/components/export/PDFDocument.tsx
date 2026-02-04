/**
 * ClearPress AI - PDF Document Component
 * Main PDF layout using @react-pdf/renderer
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

import type { ExportContentData, ExportOptions } from '@/types/export';
import { PDF_STYLES, PAPER_DIMENSIONS, CONTENT_TYPE_LABELS } from '@/types/export';
import { formatExportDate, htmlToPlainText } from '@/lib/export-utils';

// Register Japanese font (NotoSansJP from Google Fonts)
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75g.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEi75vL0g.ttf',
      fontWeight: 700,
    },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: PDF_STYLES.fontSize.body,
    color: PDF_STYLES.colors.text,
    padding: PDF_STYLES.spacing.margin,
    lineHeight: PDF_STYLES.spacing.lineHeight,
  },
  // Header
  header: {
    marginBottom: PDF_STYLES.spacing.sectionGap,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PDF_STYLES.colors.border,
  },
  headerBrand: {
    fontSize: PDF_STYLES.fontSize.small,
    color: PDF_STYLES.colors.muted,
    marginBottom: 4,
  },
  title: {
    fontSize: PDF_STYLES.fontSize.title,
    fontWeight: 700,
    marginBottom: 8,
  },
  contentTypeLabel: {
    fontSize: PDF_STYLES.fontSize.small,
    color: PDF_STYLES.colors.muted,
    marginBottom: 12,
  },
  // Metadata
  metadata: {
    marginBottom: PDF_STYLES.spacing.sectionGap,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PDF_STYLES.colors.border,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: PDF_STYLES.fontSize.small,
    color: PDF_STYLES.colors.muted,
    width: 120,
  },
  metadataValue: {
    fontSize: PDF_STYLES.fontSize.small,
    flex: 1,
  },
  // Content
  headline: {
    fontSize: PDF_STYLES.fontSize.headline,
    fontWeight: 700,
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  subheadline: {
    fontSize: PDF_STYLES.fontSize.subheadline,
    color: '#4B5563',
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  dateline: {
    fontWeight: 700,
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  lead: {
    fontWeight: 700,
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  paragraph: {
    marginBottom: PDF_STYLES.spacing.paragraphGap,
    textAlign: 'justify',
  },
  sectionHeading: {
    fontSize: PDF_STYLES.fontSize.subheadline,
    fontWeight: 700,
    marginTop: PDF_STYLES.spacing.sectionGap,
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  // Quote
  quoteContainer: {
    marginLeft: 30,
    marginRight: 30,
    marginBottom: PDF_STYLES.spacing.paragraphGap,
  },
  quoteText: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  quoteAttribution: {
    fontSize: PDF_STYLES.fontSize.small,
    textAlign: 'right',
  },
  // ISI Block
  isiBlock: {
    marginTop: PDF_STYLES.spacing.sectionGap,
    padding: 12,
    backgroundColor: PDF_STYLES.colors.isi.background,
    borderWidth: 1,
    borderColor: PDF_STYLES.colors.isi.border,
  },
  isiHeader: {
    fontSize: PDF_STYLES.fontSize.subheadline,
    fontWeight: 700,
    color: PDF_STYLES.colors.isi.text,
    marginBottom: 8,
  },
  isiContent: {
    fontSize: PDF_STYLES.fontSize.small,
    color: PDF_STYLES.colors.isi.text,
  },
  // Boilerplate Block
  boilerplateBlock: {
    marginTop: PDF_STYLES.spacing.sectionGap,
    padding: 12,
    backgroundColor: PDF_STYLES.colors.boilerplate.background,
    borderWidth: 1,
    borderColor: PDF_STYLES.colors.boilerplate.border,
  },
  boilerplateHeader: {
    fontSize: PDF_STYLES.fontSize.subheadline,
    fontWeight: 700,
    marginBottom: 8,
  },
  boilerplateContent: {
    fontSize: PDF_STYLES.fontSize.small,
  },
  // Contact
  contactSection: {
    marginTop: PDF_STYLES.spacing.sectionGap,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_STYLES.colors.border,
  },
  contactHeader: {
    fontSize: PDF_STYLES.fontSize.subheadline,
    fontWeight: 700,
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: PDF_STYLES.spacing.margin,
    right: PDF_STYLES.spacing.margin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: PDF_STYLES.fontSize.footer,
    color: PDF_STYLES.colors.muted,
    borderTopWidth: 1,
    borderTopColor: PDF_STYLES.colors.border,
    paddingTop: 8,
  },
  pageNumber: {
    fontSize: PDF_STYLES.fontSize.footer,
    color: PDF_STYLES.colors.muted,
  },
  // Compliance Score
  complianceScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  complianceLabel: {
    fontSize: PDF_STYLES.fontSize.small,
    color: PDF_STYLES.colors.muted,
    marginRight: 8,
  },
  complianceValue: {
    fontSize: PDF_STYLES.fontSize.small,
    fontWeight: 700,
  },
});

interface PDFDocumentProps {
  data: ExportContentData;
  options: ExportOptions;
}

export function PDFDocument({ data, options }: PDFDocumentProps) {
  const { content, contentType } = data;
  const { language, includeMetadata, includeComplianceScore, paperSize } = options;

  const dimensions = PAPER_DIMENSIONS[paperSize];

  // Get compliance score color
  const getComplianceColor = (score: number) => {
    if (score >= 80) return PDF_STYLES.colors.compliance.high;
    if (score >= 60) return PDF_STYLES.colors.compliance.medium;
    return PDF_STYLES.colors.compliance.low;
  };

  return (
    <Document>
      <Page size={[dimensions.width, dimensions.height]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBrand}>ClearPress AI</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.contentTypeLabel}>
            {CONTENT_TYPE_LABELS[contentType][language]}
          </Text>
        </View>

        {/* Metadata */}
        {includeMetadata && (
          <View style={styles.metadata}>
            {data.projectName && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>
                  {language === 'ja' ? 'プロジェクト:' : 'Project:'}
                </Text>
                <Text style={styles.metadataValue}>{data.projectName}</Text>
              </View>
            )}
            {data.clientName && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>
                  {language === 'ja' ? 'クライアント:' : 'Client:'}
                </Text>
                <Text style={styles.metadataValue}>{data.clientName}</Text>
              </View>
            )}
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>
                {language === 'ja' ? 'バージョン:' : 'Version:'}
              </Text>
              <Text style={styles.metadataValue}>{data.versionNumber}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>
                {language === 'ja' ? '文字数:' : 'Word Count:'}
              </Text>
              <Text style={styles.metadataValue}>{data.wordCount}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>
                {language === 'ja' ? '作成日:' : 'Created:'}
              </Text>
              <Text style={styles.metadataValue}>
                {formatExportDate(data.createdAt, language)}
              </Text>
            </View>
            {includeComplianceScore && data.complianceScore !== undefined && (
              <View style={styles.complianceScore}>
                <Text style={styles.complianceLabel}>
                  {language === 'ja' ? 'コンプライアンススコア:' : 'Compliance Score:'}
                </Text>
                <Text
                  style={[
                    styles.complianceValue,
                    { color: getComplianceColor(data.complianceScore) },
                  ]}
                >
                  {data.complianceScore}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Main Content */}
        {content.headline && <Text style={styles.headline}>{content.headline}</Text>}

        {content.subheadline && (
          <Text style={styles.subheadline}>{content.subheadline}</Text>
        )}

        {content.dateline && <Text style={styles.dateline}>{content.dateline}</Text>}

        {content.lead && <Text style={styles.lead}>{content.lead}</Text>}

        {content.introduction && (
          <Text style={styles.paragraph}>{htmlToPlainText(content.introduction)}</Text>
        )}

        {/* Body paragraphs */}
        {content.body &&
          content.body.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {htmlToPlainText(paragraph)}
            </Text>
          ))}

        {/* Raw HTML content */}
        {content.html && (!content.body || content.body.length === 0) && (
          <Text style={styles.paragraph}>{htmlToPlainText(content.html)}</Text>
        )}

        {/* Sections */}
        {content.sections &&
          content.sections.map((section, index) => (
            <View key={index}>
              {section.heading && (
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              )}
              <Text style={styles.paragraph}>{htmlToPlainText(section.content)}</Text>
            </View>
          ))}

        {/* Quotes */}
        {content.quotes &&
          content.quotes.map((quote, index) => (
            <View key={index} style={styles.quoteContainer}>
              <Text style={styles.quoteText}>"{quote.text}"</Text>
              <Text style={styles.quoteAttribution}>— {quote.attribution}</Text>
            </View>
          ))}

        {/* Conclusion */}
        {content.conclusion && (
          <Text style={styles.paragraph}>{htmlToPlainText(content.conclusion)}</Text>
        )}

        {/* CTA */}
        {content.cta && (
          <Text style={[styles.paragraph, { fontWeight: 700 }]}>
            {htmlToPlainText(content.cta)}
          </Text>
        )}

        {/* Contact */}
        {content.contact && (
          <View style={styles.contactSection}>
            <Text style={styles.contactHeader}>
              {language === 'ja' ? 'お問い合わせ' : 'Contact'}
            </Text>
            <Text style={styles.paragraph}>{content.contact}</Text>
          </View>
        )}

        {/* ISI (Important Safety Information) */}
        {content.isi && (
          <View style={styles.isiBlock}>
            <Text style={styles.isiHeader}>
              {language === 'ja' ? '重要な安全性情報' : 'IMPORTANT SAFETY INFORMATION'}
            </Text>
            <Text style={styles.isiContent}>{htmlToPlainText(content.isi)}</Text>
          </View>
        )}

        {/* Boilerplate */}
        {content.boilerplate && (
          <View style={styles.boilerplateBlock}>
            <Text style={styles.boilerplateHeader}>
              {language === 'ja' ? '会社概要' : 'About'}
            </Text>
            <Text style={styles.boilerplateContent}>
              {htmlToPlainText(content.boilerplate)}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>ClearPress AI</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
