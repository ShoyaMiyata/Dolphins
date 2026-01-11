import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'
import type { ReactionGroup } from './use-reactions'

type GroupPostReaction = Database['public']['Tables']['group_post_reactions']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row']
}

// グループ投稿のリアクション一覧取得
export function useGroupPostReactions(postId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['group-post-reactions', postId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const currentUserId = user?.id

            const { data, error } = await supabase
                .from('group_post_reactions')
                .select(`
          *,
          profiles:user_id (*)
        `)
                .eq('group_post_id', postId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('グループ投稿リアクション取得エラー:', error)
                throw error
            }

            // プロファイル配列を単一オブジェクトに変換
            const reactionsWithProfile = (data || []).map((reaction: any) => ({
                ...reaction,
                profiles: Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles,
            })) as GroupPostReaction[]

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

// グループ投稿コメントのリアクション一覧取得
export function useGroupPostCommentReactions(commentId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['group-post-comment-reactions', commentId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const currentUserId = user?.id

            const { data, error } = await supabase
                .from('group_post_reactions')
                .select(`
          *,
          profiles:user_id (*)
        `)
                .eq('group_post_comment_id', commentId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('グループ投稿コメントリアクション取得エラー:', error)
                throw error
            }

            // プロファイル配列を単一オブジェクトに変換
            const reactionsWithProfile = (data || []).map((reaction: any) => ({
                ...reaction,
                profiles: Array.isArray(reaction.profiles) ? reaction.profiles[0] : reaction.profiles,
            })) as GroupPostReaction[]

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

// グループ投稿へのリアクション追加
export function useAddGroupPostReaction() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ postId, commentId, emoji }: { postId?: string; commentId?: string; emoji: string }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('ログインが必要です')

            const userId = user.id

            const { data, error } = await supabase
                .from('group_post_reactions')
                .insert({
                    group_post_id: postId || null,
                    group_post_comment_id: commentId || null,
                    user_id: userId,
                    emoji,
                } as any)
                .select()
                .single()

            if (error) {
                // ユニーク制約違反（既にリアクション済み）の場合は無視する
                if (error.code === '23505') {
                    return
                }
                throw error
            }

            return data
        },
        onSuccess: (_, { postId, commentId }) => {
            if (postId) {
                queryClient.invalidateQueries({ queryKey: ['group-post-reactions', postId] })
                queryClient.invalidateQueries({ queryKey: ['group-posts'] })
                queryClient.invalidateQueries({ queryKey: ['group-post', postId] })
            }
            if (commentId) {
                queryClient.invalidateQueries({ queryKey: ['group-post-comment-reactions', commentId] })
            }
        },
        onError: (error: any) => {
            console.error('グループ投稿リアクション追加エラー:', error)
            toast.error('リアクションできませんでした')
        },
    })
}

// グループ投稿のリアクション削除
export function useRemoveGroupPostReaction() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ postId, commentId, emoji }: { postId?: string; commentId?: string; emoji: string }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('ログインが必要です')

            const userId = user.id

            const query = supabase
                .from('group_post_reactions')
                .delete()
                .eq('user_id', userId)
                .eq('emoji', emoji)

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
                queryClient.invalidateQueries({ queryKey: ['group-post-reactions', postId] })
                queryClient.invalidateQueries({ queryKey: ['group-posts'] })
                queryClient.invalidateQueries({ queryKey: ['group-post', postId] })
            }
            if (commentId) {
                queryClient.invalidateQueries({ queryKey: ['group-post-comment-reactions', commentId] })
            }
        },
        onError: (error: any) => {
            console.error('グループ投稿リアクション削除エラー:', error)
            toast.error('リアクション削除に失敗しました')
        },
    })
}
