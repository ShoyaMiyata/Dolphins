import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type Post = Database['public']['Tables']['posts']['Row']
type PostImage = Database['public']['Tables']['post_images']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type PostWithDetails = Post & {
  profiles: Profile
  post_images: PostImage[]
  likes_count: number
  comments_count: number
  reposts_count: number
  is_liked: boolean
  is_reposted: boolean
}

export interface CreatePostData {
  content?: string | null
  images?: File[]
}

export interface UpdatePostData {
  postId: string
  content: string
}

const POSTS_PER_PAGE = 10

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
    .from('post-images')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path)

  return publicUrl
}

// 投稿一覧取得（無限スクロール対応）
export function usePosts() {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1

      const { data: session } = await supabase.auth.getSession()
      const currentUserId = session?.session?.user?.id

      const { data, error, count } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count),
          reposts(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      // いいね・リポスト状態を取得
      const postsWithDetails: PostWithDetails[] = await Promise.all(
        (data || []).map(async (post: any) => {
          let isLiked = false
          let isReposted = false

          if (currentUserId) {
            const { data: likeData } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUserId)
              .single()

            const { data: repostData } = await supabase
              .from('reposts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUserId)
              .single()

            isLiked = !!likeData
            isReposted = !!repostData
          }

          return {
            ...post,
            profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
            post_images: Array.isArray(post.post_images)
              ? post.post_images.sort((a: any, b: any) => a.order_index - b.order_index)
              : [],
            likes_count: Array.isArray(post.likes) ? post.likes[0]?.count || 0 : 0,
            comments_count: Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0,
            reposts_count: Array.isArray(post.reposts) ? post.reposts[0]?.count || 0 : 0,
            is_liked: isLiked,
            is_reposted: isReposted,
          }
        })
      )

      return {
        posts: postsWithDetails,
        nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  })
}

// 投稿作成
export function useCreatePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      // 認証チェック
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      // 投稿作成
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: data.content || null,
        } as any)
        .select()
        .single()

      if (postError) throw postError

      // 画像がある場合はアップロード
      if (data.images && data.images.length > 0) {
        const imageUrls = await Promise.all(
          data.images.map(async (image) => uploadImage(image, userId))
        )

        // post_imagesに保存
        const postImages = imageUrls.map((url, index) => ({
          post_id: (post as any).id,
          image_url: url,
          order_index: index,
        }))

        const { error: imagesError } = await supabase
          .from('post_images')
          .insert(postImages as any)

        if (imagesError) throw imagesError
      }

      return post
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('投稿しました')
    },
    onError: (error) => {
      console.error('投稿エラー:', error)
      toast.error('投稿に失敗しました')
    },
  })
}

// 投稿更新
export function useUpdatePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, content }: UpdatePostData) => {
      const { data, error } = await ((supabase
        .from('posts') as any)
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single())

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('投稿を更新しました')
    },
    onError: (error) => {
      console.error('更新エラー:', error)
      toast.error('更新に失敗しました')
    },
  })
}

// 投稿削除
export function useDeletePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      // 画像を取得して削除
      const { data: images } = await supabase
        .from('post_images')
        .select('image_url')
        .eq('post_id', postId)

      if (images && images.length > 0) {
        // Storage から画像を削除
        const imagePaths = images.map((img: any) => {
          const url = new URL(img.image_url)
          return url.pathname.split('/post-images/')[1]
        })

        await supabase.storage
          .from('post-images')
          .remove(imagePaths)
      }

      // 投稿削除（カスケード削除で関連データも削除される）
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('投稿を削除しました')
    },
    onError: (error) => {
      console.error('削除エラー:', error)
      toast.error('削除に失敗しました')
    },
  })
}

// いいね
export function useLikePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId } as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      console.error('いいねエラー:', error)
      toast.error('いいねに失敗しました')
    },
  })
}

// いいね解除
export function useUnlikePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      console.error('いいね解除エラー:', error)
      toast.error('いいね解除に失敗しました')
    },
  })
}

// リポスト
export function useRepost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      const { error } = await supabase
        .from('reposts')
        .insert({ post_id: postId, user_id: userId } as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('リポストしました')
    },
    onError: (error) => {
      console.error('リポストエラー:', error)
      toast.error('リポストに失敗しました')
    },
  })
}

// リポスト解除
export function useUnrepost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('ログインが必要です')
      }

      const userId = session.session.user.id

      const { error } = await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('リポストを解除しました')
    },
    onError: (error) => {
      console.error('リポスト解除エラー:', error)
      toast.error('リポスト解除に失敗しました')
    },
  })
}

// 特定のユーザーの投稿一覧を取得
export function useUserPosts(userId: string | null) {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['userPosts', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) {
        return {
          posts: [],
          nextPage: undefined,
          totalCount: 0,
        }
      }

      const start = pageParam * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1

      const { data: session } = await supabase.auth.getSession()
      const currentUserId = session?.session?.user?.id

      const { data, error, count } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count),
          reposts(count)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      // いいね・リポスト状態を取得
      const postsWithDetails: PostWithDetails[] = await Promise.all(
        (data || []).map(async (post: any) => {
          let isLiked = false
          let isReposted = false

          if (currentUserId) {
            const { data: likeData } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUserId)
              .single()

            const { data: repostData } = await supabase
              .from('reposts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', currentUserId)
              .single()

            isLiked = !!likeData
            isReposted = !!repostData
          }

          return {
            ...post,
            profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
            post_images: Array.isArray(post.post_images)
              ? post.post_images.sort((a: any, b: any) => a.order_index - b.order_index)
              : [],
            likes_count: Array.isArray(post.likes) ? post.likes[0]?.count || 0 : 0,
            comments_count: Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0,
            reposts_count: Array.isArray(post.reposts) ? post.reposts[0]?.count || 0 : 0,
            is_liked: isLiked,
            is_reposted: isReposted,
          }
        })
      )

      return {
        posts: postsWithDetails,
        nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
  })
}
