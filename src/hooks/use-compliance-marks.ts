/**
 * ClearPress AI - Compliance Marks Hook
 *
 * Manages the application and removal of compliance marks in a Tiptap editor.
 * Handles position mapping between plain text and Tiptap document positions,
 * tracks dismissed issues (session-scoped), and provides actions for
 * accepting suggestions and dismissing issues.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { TextSelection } from 'prosemirror-state';
import type { CheckComplianceResponse } from '@/services/ai';

export interface ComplianceIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
  ruleReference?: string;
}

interface UseComplianceMarksOptions {
  /** The Tiptap editor instance */
  editor: Editor | null;
}

/**
 * Generate a unique ID for an issue based on its content
 */
function generateIssueId(issue: { text: string; position?: { start: number; end: number } }): string {
  const positionKey = issue.position ? `${issue.position.start}-${issue.position.end}` : 'no-pos';
  return `${positionKey}-${issue.text.slice(0, 20)}`;
}

/**
 * Convert a plain text character position to a Tiptap document position.
 *
 * Tiptap uses a different position system where each node has structural positions.
 * This function iterates through the document to find the corresponding doc position.
 *
 * @param editor - The Tiptap editor instance
 * @param textPos - The plain text character position
 * @returns The Tiptap document position, or null if not found
 */
function textPosToDocPos(editor: Editor, textPos: number): number | null {
  const { doc } = editor.state;
  let currentTextPos = 0;

  // Traverse the document to find the position
  let result: number | null = null;

  doc.descendants((node, pos) => {
    if (result !== null) return false; // Already found

    if (node.isText && node.text) {
      const nodeTextLength = node.text.length;

      // Check if target position is within this text node
      if (currentTextPos + nodeTextLength >= textPos) {
        // Found the node, calculate the offset within it
        const offset = textPos - currentTextPos;
        result = pos + offset;
        return false; // Stop traversal
      }

      currentTextPos += nodeTextLength;
    } else if (node.isBlock && !node.isTextblock) {
      // Non-text blocks (like hard breaks) may add to text position
      // For simple cases, we add newline equivalent
      currentTextPos += 1;
    }

    return true; // Continue traversal
  });

  return result;
}

/**
 * Apply compliance marks to the editor based on issues with position data.
 *
 * This clears existing marks and applies new ones for each issue.
 */
function applyMarksToEditor(
  editor: Editor,
  issues: ComplianceIssue[],
  dismissedIds: Set<string>
): void {
  // Get issues that have positions and aren't dismissed
  const issuesWithPositions = issues.filter(
    (issue) => issue.position && !dismissedIds.has(issue.id)
  );

  if (issuesWithPositions.length === 0) {
    // Clear all existing compliance marks
    clearAllComplianceMarks(editor);
    return;
  }

  // Store current selection to restore later
  const { from: selFrom, to: selTo } = editor.state.selection;

  // Create a transaction to batch all mark operations
  const { tr } = editor.state;

  // First, remove all existing compliance marks
  const { doc } = editor.state;
  doc.descendants((node, pos) => {
    if (node.isText) {
      const marks = node.marks.filter((mark) => mark.type.name === 'complianceIssue');
      marks.forEach((mark) => {
        tr.removeMark(pos, pos + node.nodeSize, mark.type);
      });
    }
    return true;
  });

  // Apply marks to the transaction
  const markType = editor.schema.marks.complianceIssue;
  if (!markType) {
    console.warn('ComplianceMark extension not registered in editor');
    return;
  }

  for (const issue of issuesWithPositions) {
    if (!issue.position) continue;

    // Convert text positions to doc positions
    const from = textPosToDocPos(editor, issue.position.start);
    const to = textPosToDocPos(editor, issue.position.end);

    if (from === null || to === null) {
      console.warn('Could not map position for issue:', issue.id);
      continue;
    }

    // Create the mark with issue data
    const mark = markType.create({
      issueType: issue.type,
      issueId: issue.id,
      message: issue.message,
      suggestion: issue.suggestion || null,
      ruleReference: issue.ruleReference || null,
    });

    tr.addMark(from, to, mark);
  }

  // Restore selection using TextSelection
  tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));

  // Apply the transaction
  editor.view.dispatch(tr);
}

/**
 * Clear all compliance marks from the editor
 */
function clearAllComplianceMarks(editor: Editor): void {
  const markType = editor.schema.marks.complianceIssue;
  if (!markType) return;

  const { tr } = editor.state;
  const { doc } = editor.state;

  doc.descendants((node, pos) => {
    if (node.isText) {
      const marks = node.marks.filter((mark) => mark.type.name === 'complianceIssue');
      marks.forEach((mark) => {
        tr.removeMark(pos, pos + node.nodeSize, mark.type);
      });
    }
    return true;
  });

  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}

/**
 * Remove a specific compliance mark by issue ID
 */
function removeMarkById(editor: Editor, issueId: string): void {
  const { tr } = editor.state;
  const { doc } = editor.state;

  doc.descendants((node, pos) => {
    if (node.isText) {
      const marks = node.marks.filter(
        (mark) =>
          mark.type.name === 'complianceIssue' &&
          mark.attrs.issueId === issueId
      );
      marks.forEach((mark) => {
        tr.removeMark(pos, pos + node.nodeSize, mark.type);
      });
    }
    return true;
  });

  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}

/**
 * Hook for managing compliance marks in a Tiptap editor
 */
export function useComplianceMarks({ editor }: UseComplianceMarksOptions) {
  // Track dismissed issues (session-scoped)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Ref to access dismissedIds in callbacks without causing re-creation
  // This breaks the circular dependency that causes infinite re-renders
  const dismissedIdsRef = useRef<Set<string>>(dismissedIds);

  // Keep ref in sync with state
  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
  }, [dismissedIds]);

  // Store current issues for reference
  const issuesRef = useRef<ComplianceIssue[]>([]);

  /**
   * Transform API response into normalized issues with IDs
   */
  const normalizeIssues = useCallback(
    (result: CheckComplianceResponse | null): ComplianceIssue[] => {
      if (!result?.suggestions) return [];

      return result.suggestions.map((s) => ({
        id: generateIssueId(s),
        type: s.severity,
        message: s.text,
        position: s.position,
        suggestion: undefined, // The API doesn't include suggestion in suggestions array
        ruleReference: undefined,
      }));
    },
    []
  );

  /**
   * Apply marks based on compliance check result
   */
  const applyMarks = useCallback(
    (result: CheckComplianceResponse | null) => {
      if (!editor) return;

      const issues = normalizeIssues(result);
      issuesRef.current = issues;

      // Use ref to access current dismissedIds without causing callback recreation
      applyMarksToEditor(editor, issues, dismissedIdsRef.current);
    },
    [editor, normalizeIssues]
  );

  /**
   * Dismiss an issue (remove its mark and remember it)
   */
  const dismissIssue = useCallback(
    (issueId: string) => {
      if (!editor) return;

      // Add to dismissed set
      setDismissedIds((prev) => new Set([...prev, issueId]));

      // Remove the mark from the editor
      removeMarkById(editor, issueId);
    },
    [editor]
  );

  /**
   * Accept a suggestion (replace text with suggested fix)
   */
  const acceptSuggestion = useCallback(
    (issueId: string, suggestion: string) => {
      if (!editor) return;

      // Find the issue
      const issue = issuesRef.current.find((i) => i.id === issueId);
      if (!issue?.position) return;

      // Convert positions
      const from = textPosToDocPos(editor, issue.position.start);
      const to = textPosToDocPos(editor, issue.position.end);

      if (from === null || to === null) return;

      // Replace the text with the suggestion
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(suggestion)
        .run();

      // Dismiss the issue since it's been fixed
      dismissIssue(issueId);
    },
    [editor, dismissIssue]
  );

  /**
   * Clear all marks (useful when switching content)
   */
  const clearMarks = useCallback(() => {
    if (!editor) return;
    clearAllComplianceMarks(editor);
    issuesRef.current = [];
  }, [editor]);

  /**
   * Reset dismissed issues (start fresh)
   */
  const resetDismissed = useCallback(() => {
    setDismissedIds(new Set());
  }, []);

  /**
   * Scroll to and highlight a specific issue
   */
  const scrollToIssue = useCallback(
    (issueId: string) => {
      if (!editor) return;

      const issue = issuesRef.current.find((i) => i.id === issueId);
      if (!issue?.position) return;

      const from = textPosToDocPos(editor, issue.position.start);
      const to = textPosToDocPos(editor, issue.position.end);

      if (from === null || to === null) return;

      // Select the text
      editor.chain().focus().setTextSelection({ from, to }).run();

      // Find the DOM element and add flash animation
      const { doc } = editor.state;
      doc.descendants((node, pos) => {
        if (node.isText) {
          const marks = node.marks.filter(
            (mark) =>
              mark.type.name === 'complianceIssue' &&
              mark.attrs.issueId === issueId
          );
          if (marks.length > 0) {
            // Get the DOM node for this position
            const domNode = editor.view.domAtPos(pos);
            if (domNode.node && domNode.node.parentElement) {
              const span = domNode.node.parentElement.closest('[data-compliance-issue]');
              if (span) {
                span.classList.add('compliance-mark-flash');
                setTimeout(() => {
                  span.classList.remove('compliance-mark-flash');
                }, 1500);
              }
            }
            return false;
          }
        }
        return true;
      });
    },
    [editor]
  );

  // Cleanup marks when editor changes or unmounts
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        clearAllComplianceMarks(editor);
      }
    };
  }, [editor]);

  return {
    /** Apply marks based on compliance check result */
    applyMarks,
    /** Dismiss an issue (session-scoped) */
    dismissIssue,
    /** Accept a suggestion and replace text */
    acceptSuggestion,
    /** Clear all compliance marks */
    clearMarks,
    /** Reset dismissed issues */
    resetDismissed,
    /** Scroll to and highlight a specific issue */
    scrollToIssue,
    /** Set of dismissed issue IDs */
    dismissedIds,
    /** Current issues with positions */
    issues: issuesRef.current,
  };
}

export default useComplianceMarks;
