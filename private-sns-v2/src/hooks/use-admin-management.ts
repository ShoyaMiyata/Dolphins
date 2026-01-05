import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Feedback = Database['public']['Tables']['feedbacks']['Row']

// Admin: Get all users with their activity info
export function useAdminUsers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          posts(count),
          comments(count),
          likes(count),
          followers:follows!follows_following_id_fkey(count),
          following:follows!follows_follower_id_fkey(count)
        `)
        .order('last_access_at', { ascending: false })

      if (error) {
        console.error('Admin users fetch error:', error)
        throw error
      }

      return data || []
    },
  })
}

// Admin: Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role } as any)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('ユーザーの権限を更新しました')
    },
    onError: (error) => {
      console.error('Update user role error:', error)
      toast.error('権限の更新に失敗しました')
    },
  })
}

// Admin: Update last access time manually
export function useUpdateLastAccess() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ last_access_at: new Date().toISOString() } as any)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('最終アクセス時刻を更新しました')
    },
    onError: (error) => {
      console.error('Update last access error:', error)
      toast.error('最終アクセス時刻の更新に失敗しました')
    },
  })
}

// Admin: Get all feedback/improvement requests
export function useAdminFeedback() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['admin', 'feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          profiles!feedbacks_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Admin feedback fetch error:', error)
        throw error
      }

      return data || []
    },
  })
}

// Admin: Update feedback status
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      feedbackId,
      status
    }: {
      feedbackId: string
      status: 'pending' | 'in_progress' | 'completed' | 'declined'
    }) => {
      const { data, error } = await supabase
        .from('feedbacks')
        .update({
          status,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', feedbackId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] })
      const statusMessages = {
        pending: '保留中',
        in_progress: '対応中',
        completed: '完了',
        declined: '却下'
      }
      toast.success(`改善要望を${statusMessages[variables.status]}に更新しました`)
    },
    onError: (error) => {
      console.error('Update feedback status error:', error)
      toast.error('ステータスの更新に失敗しました')
    },
  })
}

// Admin: Delete feedback
export function useDeleteFeedback() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', feedbackId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] })
      toast.success('改善要望を削除しました')
    },
    onError: (error) => {
      console.error('Delete feedback error:', error)
      toast.error('改善要望の削除に失敗しました')
    },
  })
}

// Admin: Get system statistics
export function useAdminStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // Get various counts
      const [usersResult, postsResult, commentsResult, feedbacksResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('feedbacks').select('*', { count: 'exact', head: true }),
      ])

      return {
        totalUsers: usersResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        totalFeedbacks: feedbacksResult.count || 0,
      }
    },
  })
}
