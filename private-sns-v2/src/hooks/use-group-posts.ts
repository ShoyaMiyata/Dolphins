import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type GroupPost = Database['public']['Tables']['group_posts']['Row']
type GroupPostImage = Database['public']['Tables']['group_post_images']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupPostWithProfile = GroupPost & {
  profiles: Profile
  group_post_images: GroupPostImage[]
}

export interface CreateGroupPostData {
  groupId: string
  content: string | null
  images?: File[]
}

export interface UpdateGroupPostData {
  postId: string
  groupId: string
  content: string
  images?: File[]
}

export interface DeleteGroupPostData {
  postId: string
  groupId: string
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
    .from('group-post-images')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('group-post-images')
    .getPublicUrl(data.path)

  return publicUrl
}

// グループ投稿一覧を取得
export function useGroupPosts(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: async () => {
      if (!groupId) return []

      const { data, error } = await supabase
        .from('group_posts')
        .select('*, group_post_images(*)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('グループ投稿取得エラー:', error)
        throw error
      }

      // 各投稿のプロフィールを個別に取得
      const postsWithProfile: GroupPostWithProfile[] = await Promise.all(
        (data || []).map(async (post: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', post.user_id)
            .single()

          return {
            ...post,
            profiles: profile,
            group_post_images: Array.isArray(post.group_post_images)
              ? post.group_post_images.sort((a: any, b: any) => a.order_index - b.order_index)
              : [],
          }
        })
      )

      return postsWithProfile
    },
    enabled: !!groupId,
  })
}

// グループ投稿作成
export function useCreateGroupPost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, content, images }: CreateGroupPostData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 投稿作成
      const { data: post, error: postError } = await (supabase as any)
        .from('group_posts')
        .insert({
          group_id: groupId,
          user_id: userId,
          content,
        })
        .select()
        .single()

      if (postError) throw postError

      // 画像がある場合はアップロード
      if (images && images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(async (image) => uploadImage(image, userId))
        )

        // group_post_imagesに保存
        const postImages = imageUrls.map((url, index) => ({
          group_post_id: (post as any).id,
          image_url: url,
          order_index: index,
        }))

        const { error: imagesError } = await supabase
          .from('group_post_images')
          .insert(postImages as any)

        if (imagesError) throw imagesError
      }

      return post
    },
    onSuccess: (_, variables) => {
      // グループ投稿一覧を更新
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] })
      toast.success('投稿しました')
    },
    onError: (error) => {
      console.error('グループ投稿エラー:', error)
      toast.error('投稿に失敗しました')
    },
  })
}

// グループ投稿更新
export function useUpdateGroupPost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, groupId, content, images }: UpdateGroupPostData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 投稿内容を更新
      const { data, error } = await (supabase as any)
        .from('group_posts')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      // 画像がある場合はアップロード
      if (images && images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(async (image) => uploadImage(image, userId))
        )

        // 既存の画像の最大order_indexを取得
        const { data: existingImages } = await supabase
          .from('group_post_images')
          .select('order_index')
          .eq('group_post_id', postId)
          .order('order_index', { ascending: false })
          .limit(1)

        const maxOrderIndex = existingImages && existingImages.length > 0 
          ? (existingImages[0] as any).order_index 
          : -1

        // group_post_imagesに保存
        const postImages = imageUrls.map((url, index) => ({
          group_post_id: postId,
          image_url: url,
          order_index: maxOrderIndex + 1 + index,
        }))

        const { error: imagesError } = await supabase
          .from('group_post_images')
          .insert(postImages as any)

        if (imagesError) throw imagesError
      }

      return data
    },
    onSuccess: (_, variables) => {
      // グループ投稿一覧を更新
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] })
      toast.success('投稿を更新しました')
    },
    onError: (error) => {
      console.error('グループ投稿更新エラー:', error)
      toast.error('投稿の更新に失敗しました')
    },
  })
}

// グループ投稿削除
export function useDeleteGroupPost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, groupId }: DeleteGroupPostData) => {
      // 画像を取得して削除
      const { data: images } = await supabase
        .from('group_post_images')
        .select('image_url')
        .eq('group_post_id', postId)

      if (images && images.length > 0) {
        // Storage から画像を削除
        const imagePaths = images.map((img: any) => {
          const url = new URL(img.image_url)
          return url.pathname.split('/group-post-images/')[1]
        })

        await supabase.storage
          .from('group-post-images')
          .remove(imagePaths)
      }

      // 投稿削除（カスケード削除で関連データも削除される）
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      // グループ投稿一覧を更新
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] })
      toast.success('投稿を削除しました')
    },
    onError: (error) => {
      console.error('グループ投稿削除エラー:', error)
      toast.error('投稿の削除に失敗しました')
    },
  })
}
