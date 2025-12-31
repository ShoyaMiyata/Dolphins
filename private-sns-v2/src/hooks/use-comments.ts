import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type Comment = Database['public']['Tables']['comments']['Row']
type CommentImage = Database['public']['Tables']['comment_images']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type CommentWithProfile = Comment & {
  profiles: Profile
  comment_images: CommentImage[]
}

export interface CreateCommentData {
  postId: string
  content: string
  images?: File[]
}

export interface UpdateCommentData {
  commentId: string
  postId: string
  content: string
}

export interface DeleteCommentData {
  commentId: string
  postId: string
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
    .from('comment-images')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('comment-images')
    .getPublicUrl(data.path)

  return publicUrl
}

// 特定の投稿のコメント一覧を取得
export function useComments(postId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return []

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(*),
          comment_images(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('コメント取得エラー:', error)
        throw error
      }

      const commentsWithProfile: CommentWithProfile[] = (data || []).map((comment: any) => ({
        ...comment,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
        comment_images: Array.isArray(comment.comment_images)
          ? comment.comment_images.sort((a: any, b: any) => a.order_index - b.order_index)
          : [],
      }))

      return commentsWithProfile
    },
    enabled: !!postId,
  })
}

// コメント作成
export function useCreateComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, content, images }: CreateCommentData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // コメント作成
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
        } as any)
        .select()
        .single()

      if (commentError) throw commentError

      // 画像がある場合はアップロード
      if (images && images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(async (image) => uploadImage(image, userId))
        )

        // comment_imagesに保存
        const commentImages = imageUrls.map((url, index) => ({
          comment_id: (comment as any).id,
          image_url: url,
          order_index: index,
        }))

        const { error: imagesError } = await supabase
          .from('comment_images')
          .insert(commentImages as any)

        if (imagesError) throw imagesError
      }

      return comment
    },
    onSuccess: (_, variables) => {
      // コメント一覧を更新
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      // 投稿一覧も更新（コメント数が変わるため）
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('コメントを投稿しました')
    },
    onError: (error) => {
      console.error('コメント投稿エラー:', error)
      toast.error('コメントの投稿に失敗しました')
    },
  })
}

// コメント更新
export function useUpdateComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ commentId, postId, content }: UpdateCommentData) => {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', commentId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // コメント一覧を更新
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      toast.success('コメントを更新しました')
    },
    onError: (error) => {
      console.error('コメント更新エラー:', error)
      toast.error('コメントの更新に失敗しました')
    },
  })
}

// コメント削除
export function useDeleteComment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ commentId, postId }: DeleteCommentData) => {
      // 画像を取得して削除
      const { data: images } = await supabase
        .from('comment_images')
        .select('image_url')
        .eq('comment_id', commentId)

      if (images && images.length > 0) {
        // Storage から画像を削除
        const imagePaths = images.map((img: any) => {
          const url = new URL(img.image_url)
          return url.pathname.split('/comment-images/')[1]
        })

        await supabase.storage
          .from('comment-images')
          .remove(imagePaths)
      }

      // コメント削除（カスケード削除で関連データも削除される）
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      // コメント一覧を更新
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      // 投稿一覧も更新（コメント数が変わるため）
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('コメントを削除しました')
    },
    onError: (error) => {
      console.error('コメント削除エラー:', error)
      toast.error('コメントの削除に失敗しました')
    },
  })
}
