import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface CommentLikeData {
  commentId: string
  postId: string // For invalidation purposes
}

// コメントのいいね状態を取得
export function useCommentLikes(commentId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['commentLikes', commentId],
    queryFn: async () => {
      if (!commentId) return { likesCount: 0, isLiked: false }

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // いいね数を取得
      const { count: likesCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)

      if (countError) {
        console.error('コメントいいね数取得エラー:', countError)
        throw countError
      }

      // ユーザーのいいね状態を取得
      let isLiked = false
      if (currentUserId) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId)
          .maybeSingle()

        isLiked = !!userLike
      }

      return {
        likesCount: likesCount || 0,
        isLiked,
      }
    },
    enabled: !!commentId,
  })
}

// コメントにいいね
export function useLikeComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 既にいいねされているか確認
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        // 既にいいねされている場合は何もしない（正常終了）
        return { alreadyLiked: true }
      }

      const { data, error } = await supabase
        .from('likes')
        .insert({ comment_id: commentId, user_id: userId } as any)
        .select()
        .single()

      if (error) {
        console.error('コメントいいね挿入エラー:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentLikes', variables.commentId] })
    },
    onError: (error: any) => {
      console.error('コメントいいねエラー詳細:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      })

      // エラーメッセージをユーザーに表示
      const errorMessage = error?.message || 'いいねに失敗しました'
      toast.error(errorMessage)
    },
  })
}

// コメントのいいね解除
export function useUnlikeComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentLikes', variables.commentId] })
    },
    onError: (error) => {
      console.error('コメントいいね解除エラー:', error)
      toast.error('いいね解除に失敗しました')
    },
  })
}
