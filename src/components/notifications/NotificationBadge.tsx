import { useUnreadNotificationCount } from '@/hooks/use-notifications';

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { data: count = 0 } = useUnreadNotificationCount();

  if (count === 0) return null;

  const displayCount = count > 9 ? '9+' : count.toString();

  return (
    <span
      className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white ${className ?? ''}`}
    >
      {displayCount}
    </span>
  );
}
