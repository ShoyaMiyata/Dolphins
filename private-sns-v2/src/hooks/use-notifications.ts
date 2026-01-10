'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type Notification = Database['public']['Tables']['notifications']['Row'] & {
  related_user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  related_post?: {
    id: string
    content: string | null
  } | null
  related_group?: {
    id: string
    name: string
  } | null
  message?: string | null
}

export function useNotifications() {
  const supabase = createClient()
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('認証が必要です')

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user:profiles!related_user_id(
            id,
            username,
            display_name,
            avatar_url
          ),
          related_post:posts!related_post_id(
            id,
            content
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // group_inviteタイプの通知の場合、related_group_idからグループ情報を取得
      const notificationsWithGroups = await Promise.all(
        (data || []).map(async (notification: any) => {
          if (notification.type === 'group_invite' && notification.related_group_id) {
            const { data: groupData } = await supabase
              .from('groups')
              .select('id, name')
              .eq('id', notification.related_group_id)
              .single()

            return {
              ...notification,
              related_group: groupData || null
            }
          }
          return notification
        })
      )

      return notificationsWithGroups as Notification[]
    },
    enabled: !!user?.id,
  })
}

export function useUnreadNotificationsCount() {
  const supabase = createClient()
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      return count || 0
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useMarkNotificationAsRead() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('認証が必要です')

      const { error } = await ((supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error)
      toast.error('通知の既読処理に失敗しました')
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('認証が必要です')

      const { error } = await ((supabase
        .from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('すべての通知を既読にしました')
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('一括既読処理に失敗しました')
    },
  })
}

export function useDeleteNotification() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('認証が必要です')

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('通知を削除しました')
    },
    onError: (error) => {
      console.error('Failed to delete notification:', error)
      toast.error('通知の削除に失敗しました')
    },
  })
}

// Helper function to create notification text
export function getNotificationText(notification: Notification): string {
  const displayName =
    notification.related_user.display_name ||
    notification.related_user.username

  switch (notification.type) {
    case 'like':
      return `${displayName}さんがあなたの投稿にいいねしました`
    case 'comment':
      return `${displayName}さんがあなたの投稿にコメントしました`
    case 'comment_reply':
      return `${displayName}さんがあなたがコメントした投稿に新しいコメントを追加しました`
    case 'repost':
      return `${displayName}さんがあなたの投稿をリポストしました`
    case 'reaction':
      return `${displayName}さんがあなたの投稿にリアクションしました`
    case 'follow':
      return `${displayName}さんがあなたをフォローしました`
    case 'group_invite':
      return notification.message || `${displayName}さんからグループへの招待が届きました`
    case 'group_join_approved':
      return notification.message || `${displayName}さんがあなたの参加リクエストを承認しました`
    case 'group_join_rejected':
      return notification.message || `${displayName}さんがあなたの参加リクエストを拒否しました`
    default:
      return '新しい通知があります'
  }
}
