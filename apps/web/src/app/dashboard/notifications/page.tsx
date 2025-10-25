'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type NotificationType = 'all' | 'info' | 'success' | 'warning' | 'error' | 'system';

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<NotificationType>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications
  const notifications = useAuthQuery(api.notifications.getAll, {
    limit: 100,
  });

  const unreadCount = useAuthQuery(api.notifications.getUnreadCount, {});

  // Mutations
  const markAsRead = useAuthMutation(api.notifications.markAsRead);
  const markMultipleAsRead = useAuthMutation(api.notifications.markMultipleAsRead);
  const markAllAsRead = useAuthMutation(api.notifications.markAllAsRead);
  const deleteNotification = useAuthMutation(api.notifications.deleteNotification);
  const deleteAll = useAuthMutation(api.notifications.deleteAll);

  // Filter notifications
  const filteredNotifications = notifications.data?.filter((notification) => {
    if (showUnreadOnly && notification.read) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    return true;
  }) || [];

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n._id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    await markMultipleAsRead.mutate({
      notificationIds: Array.from(selectedIds) as any,
    });
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await deleteNotification.mutate({ notificationId: id as any });
    }
    setSelectedIds(new Set());
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead.mutate({ notificationId: notification._id });
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: <Info className="h-5 w-5 text-blue-500" />,
      success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      system: <Settings2 className="h-5 w-5 text-gray-500" />,
    };
    return icons[type as keyof typeof icons] || icons.info;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      info: 'default',
      success: 'outline',
      warning: 'secondary',
      error: 'destructive',
      system: 'secondary',
    };
    return (
      <Badge variant={variants[type] || 'default'} className="capitalize">
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notifications and stay updated
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount.data && unreadCount.data > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {unreadCount.data} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={
                  selectedIds.size > 0 &&
                  selectedIds.size === filteredNotifications.length
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : 'Select all'}
              </span>
              {selectedIds.size > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSelectedAsRead}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark as read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter by type */}
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as NotificationType)}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              {/* Show unread only */}
              <Button
                variant={showUnreadOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                <Bell className="h-4 w-4 mr-1" />
                Unread only
              </Button>

              {/* Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate({})}
                disabled={unreadCount.data === 0}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your notifications.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAll.mutate({})}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">
                {showUnreadOnly
                  ? 'No unread notifications'
                  : filterType !== 'all'
                  ? `No ${filterType} notifications`
                  : 'No notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification._id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-accent',
                !notification.read && 'border-primary/50 bg-accent/30'
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(notification._id)}
                    onCheckedChange={() => handleSelect(notification._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-1 space-y-2" onClick={() => handleNotificationClick(notification)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="default" className="h-5 px-1.5 text-xs">
                                New
                              </Badge>
                            )}
                            {getTypeBadge(notification.type)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.actionUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.actionText || 'View details'}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(notification.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead.mutate({ notificationId: notification._id });
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate({ notificationId: notification._id });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}