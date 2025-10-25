'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const unreadCount = useAuthQuery(api.notifications.getUnreadCount, {});

  // Fetch recent notifications
  const notifications = useAuthQuery(api.notifications.getUnread, {
    limit: 5,
  });

  // Subscribe to real-time updates
  const latestNotification = useAuthQuery(api.notifications.subscribe, {});

  // Mutations
  const markAsRead = useAuthMutation(api.notifications.markAsRead);
  const markAllAsRead = useAuthMutation(api.notifications.markAllAsRead);
  const deleteNotification = useAuthMutation(
    api.notifications.deleteNotification
  );

  // Play sound for new notifications (optional)
  useEffect(() => {
    if (latestNotification.data && !latestNotification.data.read) {
      // Optional: Play notification sound
      // new Audio('/notification-sound.mp3').play();
    }
  }, [latestNotification.data]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutate({ notificationId: notificationId as any });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutate({});
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification.mutate({ notificationId: notificationId as any });
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const colors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      system: 'text-gray-500',
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount.data && unreadCount.data > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount.data && unreadCount.data > 9
                ? '9+'
                : unreadCount.data}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base">Notifications</span>
          {unreadCount.data && unreadCount.data > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notifications.data?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.data?.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className={cn(
                    'flex flex-col items-start p-3 cursor-pointer hover:bg-accent focus:bg-accent',
                    !notification.read && 'bg-accent/50'
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-1.5',
                            getNotificationIcon(notification.type)
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notification.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                        {notification.actionUrl && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, notification._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/notifications"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
