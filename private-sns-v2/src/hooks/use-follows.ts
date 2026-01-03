import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface FollowUser extends Profile {
  created_at_follow?: string
}

// フォロー
export function useFollow() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      // 自分自身をフォローできないようにする
      if (userId === followingId) {
        throw new Error('自分自身をフォローすることはできません')
      }

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: followingId,
        } as any)

      if (error) throw error
    },
    onSuccess: async (_, followingId) => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.session?.user?.id
      
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] })
      queryClient.invalidateQueries({ queryKey: ['following', userId] })
      queryClient.invalidateQueries({ queryKey: ['isFollowing', followingId] })
      queryClient.invalidateQueries({ queryKey: ['followerCount', followingId] })
      queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
      toast.success('フォローしました')
    },
    onError: (error) => {
      console.error('フォローエラー:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('フォローに失敗しました')
      }
    },
  })
}

// フォロー解除
export function useUnfollow() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', followingId)

      if (error) throw error
    },
    onSuccess: async (_, followingId) => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.session?.user?.id
      
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] })
      queryClient.invalidateQueries({ queryKey: ['following', userId] })
      queryClient.invalidateQueries({ queryKey: ['isFollowing', followingId] })
      queryClient.invalidateQueries({ queryKey: ['followerCount', followingId] })
      queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
      toast.success('フォロー解除しました')
    },
    onError: (error) => {
      console.error('フォロー解除エラー:', error)
      toast.error('フォロー解除に失敗しました')
    },
  })
}

// フォロワー一覧を取得
export function useFollowers(userId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item: any) => ({
        ...item.follower,
        created_at_follow: item.created_at,
      })) as FollowUser[]
    },
    enabled: !!userId,
  })
}

// フォロー中のユーザー一覧を取得
export function useFollowing(userId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          following:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item: any) => ({
        ...item.following,
        created_at_follow: item.created_at,
      })) as FollowUser[]
    },
    enabled: !!userId,
  })
}

// 特定のユーザーをフォローしているかチェック
export function useIsFollowing(userId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      if (!userId) return false

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return false

      const currentUserId = session.session.user.id

      // 自分自身の場合はfalse
      if (currentUserId === userId) return false

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return !!data
    },
    enabled: !!userId,
  })
}

// フォロワー数を取得
export function useFollowerCount(userId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      if (!userId) return 0

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      if (error) throw error

      return count || 0
    },
    enabled: !!userId,
  })
}

// フォロー中の数を取得
export function useFollowingCount(userId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      if (!userId) return 0

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      if (error) throw error

      return count || 0
    },
    enabled: !!userId,
  })
}
