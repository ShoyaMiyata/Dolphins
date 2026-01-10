'use client'

import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Heart, MessageCircle, Repeat2, Smile, UserPlus, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  getNotificationText,
} from '@/hooks/use-notifications'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NotificationList() {
  const router = useRouter()
  const { data: notifications, isLoading, error, isError } = useNotifications()
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }

    // Navigate to the related post or profile
    if (notification.related_post_id) {
      router.push(`/home/${notification.related_post_id}`)
    } else if (notification.type === 'follow') {
      router.push(`/profile/${notification.related_user.username}`)
    }
  }

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Heart className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">通知の取得に失敗しました</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'エラーが発生しました'}
        </p>
      </Card>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Heart className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">通知はありません</h3>
        <p className="text-sm text-muted-foreground">
          新しい通知があるとここに表示されます
        </p>
      </Card>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount}件の未読通知
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            すべて既読にする
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              'p-4 cursor-pointer hover:shadow-md transition-shadow relative bg-white rounded-xl shadow-sm border border-gray-100',
              !notification.is_read && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200'
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start gap-3">
              <NotificationIcon type={notification.type} />

              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={notification.related_user.avatar_url || undefined}
                  alt={notification.related_user.username}
                />
                <AvatarFallback>
                  {notification.related_user.display_name?.[0] ||
                    notification.related_user.username[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {getNotificationText(notification as any)}
                </p>
                {notification.related_post && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {notification.related_post.content}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => handleDelete(e, notification.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!notification.is_read && (
              <div className="absolute top-4 right-12 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function NotificationIcon({ type }: { type: string }) {
  const iconClass = 'w-5 h-5'

  switch (type) {
    case 'like':
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
          <Heart className={cn(iconClass, 'text-red-500')} />
        </div>
      )
    case 'comment':
    case 'comment_reply':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
          <MessageCircle className={cn(iconClass, 'text-blue-500')} />
        </div>
      )
    case 'repost':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
          <Repeat2 className={cn(iconClass, 'text-green-500')} />
        </div>
      )
    case 'reaction':
      return (
        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center shrink-0">
          <Smile className={cn(iconClass, 'text-yellow-500')} />
        </div>
      )
    case 'follow':
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center shrink-0">
          <UserPlus className={cn(iconClass, 'text-purple-500')} />
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Heart className={cn(iconClass, 'text-muted-foreground')} />
        </div>
      )
  }
}

function NotificationSkeleton() {
  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full bg-gray-200" />
        <Skeleton className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-gray-200" />
          <Skeleton className="h-3 w-1/2 bg-gray-200" />
          <Skeleton className="h-3 w-1/4 bg-gray-200" />
        </div>
      </div>
    </Card>
  )
}
