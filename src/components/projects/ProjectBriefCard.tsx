/**
 * ClearPress AI - Project Brief Card
 * Card displaying project brief and expanded brief
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  MessageSquare,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import type { Project, ExpandedBrief } from '@/types';

interface ProjectBriefCardProps {
  project: Project;
  onExpandBrief?: () => void;
  isExpanding?: boolean;
}

export function ProjectBriefCard({
  project,
  onExpandBrief,
  isExpanding = false,
}: ProjectBriefCardProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const [expandedOpen, setExpandedOpen] = useState(true);

  const expandedBrief = project.expanded_brief as ExpandedBrief | undefined;
  const hasExpandedBrief = expandedBrief && Object.keys(expandedBrief).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            {t('projects.brief')}
          </CardTitle>
          {isPRAdmin && onExpandBrief && !hasExpandedBrief && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExpandBrief}
              disabled={isExpanding}
              className="h-8"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('projects.expandBrief')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-6">
        {/* Original Brief */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {t('projects.originalBrief')}
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.brief}
          </p>
        </div>

        {/* Expanded Brief */}
        {hasExpandedBrief && (
          <Collapsible open={expandedOpen} onOpenChange={setExpandedOpen}>
            <div className="border-t border-gray-100 pt-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <span className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    {t('projects.expandedBrief')}
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                      AI
                    </Badge>
                  </span>
                  {expandedOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Summary */}
                {expandedBrief.summary && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      {t('projects.summary')}
                    </p>
                    <p className="text-sm text-gray-700">{expandedBrief.summary}</p>
                  </div>
                )}

                {/* Target Audience */}
                {expandedBrief.target_audience && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t('projects.targetAudience')}
                    </p>
                    {expandedBrief.target_audience.primary && expandedBrief.target_audience.primary.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{t('projects.primary')}: </span>
                        {expandedBrief.target_audience.primary.join(', ')}
                      </p>
                    )}
                    {expandedBrief.target_audience.secondary && expandedBrief.target_audience.secondary.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{t('projects.secondary')}: </span>
                        {expandedBrief.target_audience.secondary.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Key Messages */}
                {expandedBrief.key_messages && expandedBrief.key_messages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t('projects.keyMessages')}
                    </p>
                    <ul className="space-y-1">
                      {expandedBrief.key_messages.map((message, index) => (
                        <li key={index} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">•</span>
                          {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tone */}
                {expandedBrief.tone && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      {t('projects.tone')}
                    </p>
                    <p className="text-sm text-gray-700">{expandedBrief.tone}</p>
                  </div>
                )}

                {/* Deliverables */}
                {expandedBrief.deliverables && expandedBrief.deliverables.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {t('projects.deliverables')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {expandedBrief.deliverables.map((deliverable, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-100 text-gray-700"
                        >
                          {t(`content.${deliverable.type}`)}
                          {deliverable.notes && ` - ${deliverable.notes}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {expandedBrief.constraints && expandedBrief.constraints.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {t('projects.constraints')}
                    </p>
                    <ul className="space-y-1">
                      {expandedBrief.constraints.map((constraint, index) => (
                        <li key={index} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">•</span>
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* References */}
                {expandedBrief.references && expandedBrief.references.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      {t('projects.references')}
                    </p>
                    <ul className="space-y-1">
                      {expandedBrief.references.map((reference, index) => (
                        <li key={index} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">•</span>
                          {reference}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
