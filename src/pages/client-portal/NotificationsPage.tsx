/**
 * ClearPress AI - Client Portal Notifications Page
 * List of notifications for client users
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BellOff,
  Check,
  CheckCheck,
  FileText,
  MessageSquare,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { NotificationType, Notification } from '@/types';

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  project_request: FileText,
  content_submitted: FileText,
  comment_added: MessageSquare,
  approval_needed: AlertCircle,
  content_approved: Check,
  deadline_reminder: Clock,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  project_request: 'bg-blue-100 text-blue-800',
  content_submitted: 'bg-purple-100 text-purple-800',
  comment_added: 'bg-yellow-100 text-yellow-800',
  approval_needed: 'bg-orange-100 text-orange-800',
  content_approved: 'bg-green-100 text-green-800',
  deadline_reminder: 'bg-red-100 text-red-800',
};

export function NotificationsPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: notifications, isLoading, error } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to the link if available
    if (notification.metadata?.link) {
      navigate(notification.metadata.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-muted-foreground">
              {language === 'ja'
                ? '通知の読み込みに失敗しました'
                : 'Failed to load notifications'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {language === 'ja' ? '通知' : 'Notifications'}
          </h1>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {language === 'ja' ? 'すべて既読' : 'Mark all read'}
          </Button>
        )}
      </div>

      {/* Notification list */}
      {!notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {language === 'ja'
                  ? '通知はありません'
                  : 'No notifications'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            const colorClass = NOTIFICATION_COLORS[notification.type];

            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${colorClass} flex-shrink-0`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`font-medium text-sm ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString(
                          language === 'ja' ? 'ja-JP' : 'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
