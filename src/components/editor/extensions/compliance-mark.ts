/**
 * ClearPress AI - Compliance Mark Extension for Tiptap
 *
 * Custom mark extension that highlights compliance issues in the editor
 * with color-coded wavy underlines (red for errors, yellow for warnings,
 * blue for suggestions) similar to grammar checkers.
 */

import { Mark, mergeAttributes, type CommandProps } from '@tiptap/core';

export interface ComplianceMarkAttributes {
  /** Severity level of the issue */
  issueType: 'error' | 'warning' | 'suggestion';
  /** Unique identifier for this issue instance */
  issueId: string;
  /** Description of the compliance issue */
  message: string;
  /** Suggested replacement text */
  suggestion?: string;
  /** Reference to the regulation (e.g., "薬機法第66条") */
  ruleReference?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    complianceIssue: {
      /**
       * Set a compliance issue mark
       */
      setComplianceIssue: (attributes: ComplianceMarkAttributes) => ReturnType;
      /**
       * Toggle a compliance issue mark
       */
      toggleComplianceIssue: (attributes: ComplianceMarkAttributes) => ReturnType;
      /**
       * Unset the compliance issue mark
       */
      unsetComplianceIssue: () => ReturnType;
    };
  }
}

export const ComplianceMark = Mark.create<{
  HTMLAttributes: Record<string, unknown>;
}>({
  name: 'complianceIssue',

  // Allow this mark to coexist with other marks
  inclusive: false,
  excludes: '',

  addAttributes() {
    return {
      issueType: {
        default: 'warning',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-issue-type'),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-issue-type': attributes.issueType,
        }),
      },
      issueId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-issue-id'),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-issue-id': attributes.issueId,
        }),
      },
      message: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-message'),
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-message': attributes.message,
        }),
      },
      suggestion: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-suggestion'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.suggestion
            ? { 'data-suggestion': attributes.suggestion }
            : {},
      },
      ruleReference: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-rule-reference'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.ruleReference
            ? { 'data-rule-reference': attributes.ruleReference }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-compliance-issue]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const issueType = (HTMLAttributes['data-issue-type'] as string) || 'warning';
    const typeClasses: Record<string, string> = {
      error: 'compliance-mark-error',
      warning: 'compliance-mark-warning',
      suggestion: 'compliance-mark-suggestion',
    };

    return [
      'span',
      mergeAttributes(
        {
          class: typeClasses[issueType] || typeClasses.warning,
          'data-compliance-issue': 'true',
        },
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setComplianceIssue:
        (attributes: ComplianceMarkAttributes) =>
        ({ commands }: CommandProps) => {
          return commands.setMark(this.name, attributes);
        },
      toggleComplianceIssue:
        (attributes: ComplianceMarkAttributes) =>
        ({ commands }: CommandProps) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetComplianceIssue:
        () =>
        ({ commands }: CommandProps) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default ComplianceMark;
