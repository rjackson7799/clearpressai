import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import type { Notification } from '@/types';

import { NotificationBadge } from './NotificationBadge';
import { NotificationItem } from './NotificationItem';

interface NotificationCenterProps {
  variant?: 'pr' | 'client';
}

export function NotificationCenter({ variant = 'client' }: NotificationCenterProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useNotifications({ limit: 10 });
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Enable real-time notification updates with toast for new notifications
  useNotificationsRealtime({ showToast: true });

  const viewAllPath = variant === 'pr' ? '/pr/notifications' : '/client/notifications';

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to linked content
    if (notification.metadata?.link) {
      navigate(notification.metadata.link);
    } else if (notification.metadata?.project_id && notification.metadata?.content_item_id) {
      const basePath = variant === 'pr' ? '/pr' : '/client';
      navigate(`${basePath}/projects/${notification.metadata.project_id}/content/${notification.metadata.content_item_id}`);
    } else if (notification.metadata?.project_id) {
      const basePath = variant === 'pr' ? '/pr' : '/client';
      navigate(`${basePath}/projects/${notification.metadata.project_id}`);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <NotificationBadge />
          <span className="sr-only">{t('notifications.title')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification List */}
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t('notifications.empty')}
              </p>
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => navigate(viewAllPath)}
          >
            {t('common.viewAll')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
