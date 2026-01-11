import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// グループ投稿へのいいね
export function useLikeGroupPost() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ postId, commentId }: { postId?: string; commentId?: string }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('ログインが必要です')
            }

            const userId = user.id

            // 既にいいねされているか確認
            const query = supabase
                .from('group_post_likes')
                .select('id')
                .eq('user_id', userId)

            if (postId) {
                query.eq('group_post_id', postId)
            } else if (commentId) {
                query.eq('group_post_comment_id', commentId)
            } else {
                throw new Error('postId or commentId is required')
            }

            const { data: existingLike } = await query.maybeSingle()

            if (existingLike) {
                // 既にいいねされている場合は何もしない
                return { alreadyLiked: true }
            }

            const { data, error } = await supabase
                .from('group_post_likes')
                .insert({
                    group_post_id: postId || null,
                    group_post_comment_id: commentId || null,
                    user_id: userId,
                } as any)
                .select()
                .single()

            if (error) {
                console.error('グループ投稿いいねエラー:', error)
                throw error
            }

            return data
        },
        onSuccess: (data, { postId, commentId }) => {
            // クエリを無効化して更新を促す
            if (postId) {
                queryClient.invalidateQueries({ queryKey: ['group-posts'] })
                queryClient.invalidateQueries({ queryKey: ['group-post', postId] })
            }
            if (commentId) {
                queryClient.invalidateQueries({ queryKey: ['group-post-comments'] })
            }
        },
        onError: (error: any) => {
            console.error('グループ投稿いいねエラー:', error)
            toast.error(error?.message || 'いいねに失敗しました')
        },
    })
}

// グループ投稿のいいね解除
export function useUnlikeGroupPost() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ postId, commentId }: { postId?: string; commentId?: string }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('ログインが必要です')
            }

            const userId = user.id

            const query = supabase
                .from('group_post_likes')
                .delete()
                .eq('user_id', userId)

            if (postId) {
                query.eq('group_post_id', postId)
            } else if (commentId) {
                query.eq('group_post_comment_id', commentId)
            }

            const { error } = await query

            if (error) throw error
        },
        onSuccess: (_, { postId, commentId }) => {
            if (postId) {
                queryClient.invalidateQueries({ queryKey: ['group-posts'] })
                queryClient.invalidateQueries({ queryKey: ['group-post', postId] })
            }
            if (commentId) {
                queryClient.invalidateQueries({ queryKey: ['group-post-comments'] })
            }
        },
        onError: (error: any) => {
            console.error('グループ投稿いいね解除エラー:', error)
            toast.error('いいね解除に失敗しました')
        },
    })
}
