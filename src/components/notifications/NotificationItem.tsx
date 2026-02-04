import {
  FileText,
  MessageSquare,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

import { useLanguage } from '@/contexts/LanguageContext';
import type { Notification, NotificationType } from '@/types';

const NOTIFICATION_ICONS: Record<NotificationType, typeof FileText> = {
  project_request: FileText,
  content_submitted: FileText,
  comment_added: MessageSquare,
  approval_needed: AlertCircle,
  content_approved: Check,
  deadline_reminder: Clock,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  project_request: 'bg-blue-100 text-blue-600',
  content_submitted: 'bg-purple-100 text-purple-600',
  comment_added: 'bg-yellow-100 text-yellow-600',
  approval_needed: 'bg-orange-100 text-orange-600',
  content_approved: 'bg-green-100 text-green-600',
  deadline_reminder: 'bg-red-100 text-red-600',
};

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { language } = useLanguage();
  const Icon = NOTIFICATION_ICONS[notification.type];
  const colorClass = NOTIFICATION_COLORS[notification.type];

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: language === 'ja' ? ja : enUS,
  });

  const handleClick = () => {
    onClick?.(notification);
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
    >
      {/* Type Icon */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notification.title}
          </p>
          {/* Unread indicator */}
          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {timeAgo}
        </p>
      </div>
    </button>
  );
}
