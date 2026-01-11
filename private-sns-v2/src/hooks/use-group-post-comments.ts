import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type GroupPostComment = Database['public']['Tables']['group_post_comments']['Row']
type GroupPostCommentImage = Database['public']['Tables']['group_post_comment_images']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupPostCommentWithProfile = GroupPostComment & {
    profiles: Profile
    group_post_comment_images: GroupPostCommentImage[]
}

export interface CreateGroupPostCommentData {
    groupPostId: string
    content: string
    images?: File[]
}

export interface UpdateGroupPostCommentData {
    commentId: string
    groupPostId: string
    content: string
}

export interface DeleteGroupPostCommentData {
    commentId: string
    groupPostId: string
}

// 画像圧縮オプション
const compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
}

// 画像をStorageにアップロード
async function uploadImage(file: File, userId: string): Promise<string> {
    const supabase = createClient()

    // 画像を圧縮
    const compressedFile = await imageCompression(file, compressionOptions)

    // ファイル名を生成
    const fileExt = compressedFile.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Storageにアップロード
    const { data, error } = await supabase.storage
        .from('group-post-comment-images')
        .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) throw error

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
        .from('group-post-comment-images')
        .getPublicUrl(data.path)

    return publicUrl
}

// 特定のグループ投稿のコメント一覧を取得
export function useGroupPostComments(groupPostId: string | null) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['group-post-comments', groupPostId],
        queryFn: async () => {
            if (!groupPostId) return []

            const { data, error } = await supabase
                .from('group_post_comments')
                .select('*')
                .eq('group_post_id', groupPostId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('グループ投稿コメント取得エラー:', error)
                throw error
            }

            // 各コメントのプロフィールと画像を個別に取得
            const commentsWithProfile: GroupPostCommentWithProfile[] = await Promise.all(
                (data || []).map(async (comment: any) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', comment.user_id)
                        .single()

                    const { data: images } = await supabase
                        .from('group_post_comment_images')
                        .select('*')
                        .eq('group_post_comment_id', comment.id)
                        .order('order_index', { ascending: true })

                    return {
                        ...comment,
                        profiles: profile,
                        group_post_comment_images: images || [],
                    }
                })
            )

            return commentsWithProfile
        },
        enabled: !!groupPostId,
    })
}

// グループ投稿コメント作成
export function useCreateGroupPostComment() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ groupPostId, content, images }: CreateGroupPostCommentData) => {
            console.log('グループ投稿コメント作成開始:', { groupPostId, content, hasImages: !!images?.length })

            // 認証チェック
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('ログインが必要です')
            }

            const userId = user.id

            // コメント作成
            const { data: comment, error: commentError } = await supabase
                .from('group_post_comments')
                .insert({
                    group_post_id: groupPostId,
                    user_id: userId,
                    content,
                } as any)
                .select()
                .single()

            if (commentError) {
                console.error('グループ投稿コメントINSERTエラー:', commentError)
                throw new Error(`コメントの作成に失敗しました: ${commentError.message}`)
            }

            console.log('グループ投稿コメント作成成功:', comment)

            // 画像がある場合はアップロード
            if (images && images.length > 0) {
                try {
                    const imageUrls = await Promise.all(
                        images.map(async (image) => uploadImage(image, userId))
                    )

                    // group_post_comment_imagesに保存
                    const commentImages = imageUrls.map((url, index) => ({
                        group_post_comment_id: (comment as any).id,
                        image_url: url,
                        order_index: index,
                    }))

                    const { error: imagesError } = await supabase
                        .from('group_post_comment_images')
                        .insert(commentImages as any)

                    if (imagesError) {
                        console.error('グループ投稿コメント画像INSERTエラー:', imagesError)
                        console.warn('画像アップロードに失敗しましたが、コメントは作成されました')
                    }
                } catch (imageError) {
                    console.error('画像アップロードエラー:', imageError)
                    console.warn('画像アップロードに失敗しましたが、コメントは作成されました')
                }
            }

            return comment
        },
        onSuccess: (_, variables) => {
            // コメント一覧を更新
            queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.groupPostId] })
            // グループ投稿一覧も更新（コメント数が変わるため）
            queryClient.invalidateQueries({ queryKey: ['group-posts'] })
            queryClient.invalidateQueries({ queryKey: ['group-post'] })
            toast.success('コメントを投稿しました')
        },
        onError: (error) => {
            console.error('グループ投稿コメントエラー:', error)
            const errorMessage = error instanceof Error ? error.message : 'コメントの投稿に失敗しました'
            toast.error(errorMessage)
        },
    })
}

// グループ投稿コメント更新
export function useUpdateGroupPostComment() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ commentId, groupPostId, content }: UpdateGroupPostCommentData) => {
            const { data, error } = await (supabase as any)
                .from('group_post_comments')
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', commentId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            // コメント一覧を更新
            queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.groupPostId] })
            toast.success('コメントを更新しました')
        },
        onError: (error) => {
            console.error('グループ投稿コメント更新エラー:', error)
            toast.error('コメントの更新に失敗しました')
        },
    })
}

// グループ投稿コメント削除
export function useDeleteGroupPostComment() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ commentId, groupPostId }: DeleteGroupPostCommentData) => {
            // 画像を取得して削除
            const { data: images } = await supabase
                .from('group_post_comment_images')
                .select('image_url')
                .eq('group_post_comment_id', commentId)

            if (images && images.length > 0) {
                // Storage から画像を削除
                const imagePaths = images.map((img: any) => {
                    const url = new URL(img.image_url)
                    return url.pathname.split('/group-post-comment-images/')[1]
                })

                await supabase.storage
                    .from('group-post-comment-images')
                    .remove(imagePaths)
            }

            // コメント削除（カスケード削除で関連データも削除される）
            const { error } = await supabase
                .from('group_post_comments')
                .delete()
                .eq('id', commentId)

            if (error) throw error
        },
        onSuccess: (_, variables) => {
            // コメント一覧を更新
            queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.groupPostId] })
            // グループ投稿一覧も更新（コメント数が変わるため）
            queryClient.invalidateQueries({ queryKey: ['group-posts'] })
            queryClient.invalidateQueries({ queryKey: ['group-post'] })
            toast.success('コメントを削除しました')
        },
        onError: (error) => {
            console.error('グループ投稿コメント削除エラー:', error)
            toast.error('コメントの削除に失敗しました')
        },
    })
}
