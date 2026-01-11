import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// グループ投稿へのいいね
export function useLikeGroupPost() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (postId: string) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('ログインが必要です')
            }

            const userId = user.id

            // 既にいいねされているか確認
            const { data: existingLike } = await supabase
                .from('group_post_likes')
                .select('id')
                .eq('group_post_id', postId)
                .eq('user_id', userId)
                .maybeSingle()

            if (existingLike) {
                // 既にいいねされている場合は何もしない
                return { alreadyLiked: true }
            }

            const { data, error } = await supabase
                .from('group_post_likes')
                .insert({
                    group_post_id: postId,
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
        onSuccess: (data, postId) => {
            // 特定のグループ投稿のクエリを無効化する代わりに、
            // 楽観的更新を行うか、広範囲のクエリを無効化する
            // ここではグループ投稿一覧のクエリキーが分からない（groupIdが必要）ため、
            // 呼び出し元でinvalidate Queriesを行うか、
            // useGroupPostsのキャッシュキー構造を考慮する必要がある。
            // 一旦、全グループ投稿キャッシュを対象にするのは少し乱暴だが、
            // useGroupPost(単一)ではgroupIdもキーに含まれる。

            // 理想は、mutationの引数にgroupIdを含めることだが、
            // PostCardのインターフェース上、postIdしか渡されない可能性がある。

            // ここでは queryClient.invalidateQueries({ queryKey: ['group-posts'] }) と
            // queryClient.invalidateQueries({ queryKey: ['group-post'] }) を実行して更新を促す。
            queryClient.invalidateQueries({ queryKey: ['group-posts'] })
            queryClient.invalidateQueries({ queryKey: ['group-post'] })
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
        mutationFn: async (postId: string) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('ログインが必要です')
            }

            const userId = user.id

            const { error } = await supabase
                .from('group_post_likes')
                .delete()
                .eq('group_post_id', postId)
                .eq('user_id', userId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-posts'] })
            queryClient.invalidateQueries({ queryKey: ['group-post'] })
        },
        onError: (error: any) => {
            console.error('グループ投稿いいね解除エラー:', error)
            toast.error('いいね解除に失敗しました')
        },
    })
}
