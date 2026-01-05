import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type Reaction = Database['public']['Tables']['reactions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type ReactionWithProfile = Reaction & {
  profiles: Profile
}

export interface ReactionGroup {
  emoji: string
  count: number
  users: Profile[]
  hasReacted: boolean
}

export interface AddReactionData {
  postId?: string
  commentId?: string
  emoji: string
}

export interface RemoveReactionData {
  postId?: string
  commentId?: string
  emoji: string
}

// 特定の投稿のリアクション一覧を取得
export function useReactions(postId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['reactions', 'post', postId],
    queryFn: async () => {
      if (!postId) return []

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          profiles!reactions_user_id_fkey(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('リアクション取得エラー:', error)
        throw error
      }

      const reactionsWithProfile: ReactionWithProfile[] = (data || []).map((reaction: any) => ({
        ...reaction,
        profiles: Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles,
      }))

      // 絵文字ごとにグループ化
      const grouped = reactionsWithProfile.reduce((acc, reaction) => {
        const existing = acc.find((g) => g.emoji === reaction.emoji)
        if (existing) {
          existing.count++
          existing.users.push(reaction.profiles)
          if (currentUserId === reaction.user_id) {
            existing.hasReacted = true
          }
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.profiles],
            hasReacted: currentUserId === reaction.user_id,
          })
        }
        return acc
      }, [] as ReactionGroup[])

      return grouped
    },
    enabled: !!postId,
  })
}

// 特定のコメントのリアクション一覧を取得
export function useCommentReactions(commentId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['reactions', 'comment', commentId],
    queryFn: async () => {
      if (!commentId) return []

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          profiles!reactions_user_id_fkey(*)
        `)
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('コメントリアクション取得エラー:', error)
        throw error
      }

      const reactionsWithProfile: ReactionWithProfile[] = (data || []).map((reaction: any) => ({
        ...reaction,
        profiles: Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles,
      }))

      // 絵文字ごとにグループ化
      const grouped = reactionsWithProfile.reduce((acc, reaction) => {
        const existing = acc.find((g) => g.emoji === reaction.emoji)
        if (existing) {
          existing.count++
          existing.users.push(reaction.profiles)
          if (currentUserId === reaction.user_id) {
            existing.hasReacted = true
          }
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.profiles],
            hasReacted: currentUserId === reaction.user_id,
          })
        }
        return acc
      }, [] as ReactionGroup[])

      return grouped
    },
    enabled: !!commentId,
  })
}

// リアクションを追加
export function useAddReaction() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, commentId, emoji }: AddReactionData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 既存のリアクションをチェック
      const existingQuery = supabase
        .from('reactions')
        .select('id')
        .eq('user_id', userId)
        .eq('emoji', emoji)

      if (postId) {
        existingQuery.eq('post_id', postId)
      } else if (commentId) {
        existingQuery.eq('comment_id', commentId)
      }

      const { data: existing } = await existingQuery.single()

      if (existing) {
        // 既に同じリアクションが存在する場合は何もしない
        return
      }

      // リアクションを追加
      const reactionData: any = {
        user_id: userId,
        emoji,
      }

      if (postId) {
        reactionData.post_id = postId
      } else if (commentId) {
        reactionData.comment_id = commentId
      }

      const { data, error } = await supabase
        .from('reactions')
        .insert(reactionData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // リアクション一覧を更新
      if (variables.postId) {
        queryClient.invalidateQueries({ queryKey: ['reactions', 'post', variables.postId] })
      } else if (variables.commentId) {
        queryClient.invalidateQueries({ queryKey: ['reactions', 'comment', variables.commentId] })
      }
    },
    onError: (error) => {
      console.error('リアクション追加エラー:', error)
      toast.error('リアクションの追加に失敗しました')
    },
  })
}

// リアクションを削除
export function useRemoveReaction() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, commentId, emoji }: RemoveReactionData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      const deleteQuery = supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('emoji', emoji)

      if (postId) {
        deleteQuery.eq('post_id', postId)
      } else if (commentId) {
        deleteQuery.eq('comment_id', commentId)
      }

      const { error } = await deleteQuery

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      // リアクション一覧を更新
      if (variables.postId) {
        queryClient.invalidateQueries({ queryKey: ['reactions', 'post', variables.postId] })
      } else if (variables.commentId) {
        queryClient.invalidateQueries({ queryKey: ['reactions', 'comment', variables.commentId] })
      }
    },
    onError: (error) => {
      console.error('リアクション削除エラー:', error)
      toast.error('リアクションの削除に失敗しました')
    },
  })
}
