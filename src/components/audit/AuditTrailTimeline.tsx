import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import {
  getActorDisplay,
  getEventTypeLabel,
  isBackfilledEvent,
} from "@/lib/audit-events-display";
import type { AuditTrailEvent } from "@/types/domain";

interface AuditTrailTimelineProps {
  events: AuditTrailEvent[];
}

// Chronological audit trail render. Backfilled rows (details.completeness =
// 'latest_state_only') get a muted "backfilled" badge so reviewers can
// distinguish historical reconstruction from live events recorded in
// Phase 4+.
export function AuditTrailTimeline({ events }: AuditTrailTimelineProps) {
  const { i18n } = useTranslation();
  const isJa = i18n.language.startsWith("ja");

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        <BilingualLabel ja="イベントなし" en="No events" />
      </p>
    );
  }

  return (
    <ol className="space-y-2 border-l-2 border-muted pl-4">
      {events.map((e) => {
        const label = getEventTypeLabel(e.event_type);
        const actor = getActorDisplay(e);
        const backfilled = isBackfilledEvent(e);
        return (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-foreground/60" />
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-medium">{isJa ? label.ja : label.en}</span>
              <span className="text-xs text-muted-foreground">
                {isJa ? label.en : label.ja}
              </span>
              {backfilled && (
                <Badge variant="outline" className="text-xs font-normal">
                  <BilingualLabel ja="遡及記録" en="Backfilled" />
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(e.occurred_at).toLocaleString()}
              {" · "}
              {isJa ? actor.ja : actor.en}
              {e.model_used ? ` · ${e.model_used}` : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
