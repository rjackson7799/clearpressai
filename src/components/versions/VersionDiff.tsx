/**
 * VersionDiff - Visual diff rendering component for comparing versions
 */

import { useMemo } from 'react';
import { diffWords, diffChars, type Change } from 'diff';
import { cn } from '@/lib/utils';
import type { StructuredContent } from '@/types';

interface VersionDiffProps {
  oldContent: StructuredContent;
  newContent: StructuredContent;
  mode?: 'inline' | 'side-by-side';
  granularity?: 'word' | 'character';
}

interface DiffStats {
  additions: number;
  deletions: number;
  totalChanges: number;
}

/**
 * Extract plain text from structured content for comparison
 */
function getPlainText(content: StructuredContent): string {
  const parts: string[] = [];

  if (content.headline) parts.push(content.headline);
  if (content.subheadline) parts.push(content.subheadline);
  if (content.lead) parts.push(content.lead);
  if (content.body) parts.push(...content.body);
  if (content.quotes) {
    content.quotes.forEach((q) => parts.push(`"${q.text}" — ${q.attribution}`));
  }
  if (content.boilerplate) parts.push(content.boilerplate);
  if (content.isi) parts.push(content.isi);
  if (content.title) parts.push(content.title);
  if (content.introduction) parts.push(content.introduction);
  if (content.sections) {
    content.sections.forEach((s) => {
      parts.push(s.heading);
      parts.push(s.content);
    });
  }
  if (content.conclusion) parts.push(content.conclusion);
  if (content.plain_text) parts.push(content.plain_text);
  if (content.html) {
    // Strip HTML tags for plain text comparison
    const stripped = content.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    parts.push(stripped);
  }

  return parts.join('\n\n');
}

/**
 * Calculate diff statistics
 */
function calculateStats(changes: Change[]): DiffStats {
  let additions = 0;
  let deletions = 0;

  changes.forEach((change) => {
    if (change.added) {
      additions += change.value.length;
    } else if (change.removed) {
      deletions += change.value.length;
    }
  });

  return {
    additions,
    deletions,
    totalChanges: additions + deletions,
  };
}

/**
 * Render a single diff change
 */
function DiffChange({ change }: { change: Change }) {
  if (change.added) {
    return (
      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        {change.value}
      </span>
    );
  }
  if (change.removed) {
    return (
      <span className="bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300">
        {change.value}
      </span>
    );
  }
  return <span>{change.value}</span>;
}

export function VersionDiff({
  oldContent,
  newContent,
  mode = 'inline',
  granularity = 'word',
}: VersionDiffProps) {
  const { changes, stats } = useMemo(() => {
    const oldText = getPlainText(oldContent);
    const newText = getPlainText(newContent);

    const diffFn = granularity === 'word' ? diffWords : diffChars;
    const changes = diffFn(oldText, newText);
    const stats = calculateStats(changes);

    return { changes, stats };
  }, [oldContent, newContent, granularity]);

  if (mode === 'side-by-side') {
    return <SideBySideDiff changes={changes} stats={stats} />;
  }

  return <InlineDiff changes={changes} stats={stats} />;
}

interface DiffViewProps {
  changes: Change[];
  stats: DiffStats;
}

function InlineDiff({ changes, stats }: DiffViewProps) {
  if (stats.totalChanges === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No differences found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <DiffStatsBar stats={stats} />

      {/* Diff content */}
      <div className="p-4 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
        {changes.map((change, index) => (
          <DiffChange key={index} change={change} />
        ))}
      </div>
    </div>
  );
}

function SideBySideDiff({ changes, stats }: DiffViewProps) {
  // Separate old and new content for side-by-side view
  const { oldParts, newParts } = useMemo(() => {
    const oldParts: { text: string; type: 'unchanged' | 'removed' }[] = [];
    const newParts: { text: string; type: 'unchanged' | 'added' }[] = [];

    changes.forEach((change) => {
      if (change.added) {
        newParts.push({ text: change.value, type: 'added' });
      } else if (change.removed) {
        oldParts.push({ text: change.value, type: 'removed' });
      } else {
        oldParts.push({ text: change.value, type: 'unchanged' });
        newParts.push({ text: change.value, type: 'unchanged' });
      }
    });

    return { oldParts, newParts };
  }, [changes]);

  if (stats.totalChanges === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No differences found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <DiffStatsBar stats={stats} />

      {/* Side by side panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Old version */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Removed
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed min-h-[200px]">
            {oldParts.map((part, index) => (
              <span
                key={index}
                className={cn(
                  part.type === 'removed' &&
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                )}
              >
                {part.text}
              </span>
            ))}
          </div>
        </div>

        {/* New version */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Added
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed min-h-[200px]">
            {newParts.map((part, index) => (
              <span
                key={index}
                className={cn(
                  part.type === 'added' &&
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                )}
              >
                {part.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffStatsBar({ stats }: { stats: DiffStats }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-emerald-600 dark:text-emerald-400">
          +{stats.additions}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-red-600 dark:text-red-400">
          -{stats.deletions}
        </span>
      </div>
    </div>
  );
}

/**
 * Hook to get diff statistics without rendering
 */
export function useDiffStats(
  oldContent: StructuredContent,
  newContent: StructuredContent,
  granularity: 'word' | 'character' = 'word'
): DiffStats {
  return useMemo(() => {
    const oldText = getPlainText(oldContent);
    const newText = getPlainText(newContent);

    const diffFn = granularity === 'word' ? diffWords : diffChars;
    const changes = diffFn(oldText, newText);

    return calculateStats(changes);
  }, [oldContent, newContent, granularity]);
}

/**
 * Get plain text from structured content (exported for use elsewhere)
 */
export { getPlainText };
