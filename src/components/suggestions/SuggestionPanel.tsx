/**
 * ClearPress AI - Suggestion Panel
 * List of suggestions with filtering and actions
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAcceptSuggestion,
  useRejectSuggestion,
  useDeleteSuggestion,
} from '@/hooks/use-suggestions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SuggestionItem } from './SuggestionItem';
import { GitCompareArrows } from 'lucide-react';
import type { ClientSuggestion } from '@/types';

type SuggestionFilter = 'all' | 'pending' | 'accepted' | 'rejected';

interface SuggestionPanelProps {
  suggestions: ClientSuggestion[];
  currentUserId?: string;
  contentItemId: string;
  isLoading?: boolean;
  canReview?: boolean;
}

export function SuggestionPanel({
  suggestions,
  currentUserId,
  contentItemId,
  isLoading = false,
  canReview = false,
}: SuggestionPanelProps) {
  const { language, t } = useLanguage();
  const [filter, setFilter] = useState<SuggestionFilter>('all');

  // Mutations
  const acceptSuggestion = useAcceptSuggestion();
  const rejectSuggestion = useRejectSuggestion();
  const deleteSuggestion = useDeleteSuggestion();

  const isActionLoading =
    acceptSuggestion.isPending ||
    rejectSuggestion.isPending ||
    deleteSuggestion.isPending;

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (filter === 'all') return suggestions;
    return suggestions.filter((s) => s.status === filter);
  }, [suggestions, filter]);

  // Count by status
  const counts = useMemo(() => {
    return {
      all: suggestions.length,
      pending: suggestions.filter((s) => s.status === 'pending').length,
      accepted: suggestions.filter((s) => s.status === 'accepted').length,
      rejected: suggestions.filter((s) => s.status === 'rejected').length,
    };
  }, [suggestions]);

  // Handlers
  const handleAccept = async (suggestionId: string) => {
    await acceptSuggestion.mutateAsync({
      suggestionId,
      contentItemId,
    });
  };

  const handleReject = async (suggestionId: string) => {
    await rejectSuggestion.mutateAsync({
      suggestionId,
      contentItemId,
    });
  };

  const handleDelete = async (suggestionId: string) => {
    await deleteSuggestion.mutateAsync({
      suggestionId,
      contentItemId,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as SuggestionFilter)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all" className="text-xs">
                {language === 'ja' ? 'すべて' : 'All'}
                {counts.all > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {counts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                {t('suggestions.pending')}
                {counts.pending > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-amber-100 text-amber-800">
                    {counts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs">
                {t('suggestions.accept')}
                {counts.accepted > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-green-100 text-green-800">
                    {counts.accepted}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                {t('suggestions.reject')}
                {counts.rejected > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-red-100 text-red-800">
                    {counts.rejected}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Suggestion list - shared content for all tabs */}
            <TabsContent value={filter} className="mt-0">
              {filteredSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredSuggestions.map((suggestion) => (
                    <SuggestionItem
                      key={suggestion.id}
                      suggestion={suggestion}
                      currentUserId={currentUserId}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onDelete={handleDelete}
                      isActionLoading={isActionLoading}
                      canReview={canReview}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-8 text-center">
                  <GitCompareArrows className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {t('suggestions.empty')}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default SuggestionPanel;
