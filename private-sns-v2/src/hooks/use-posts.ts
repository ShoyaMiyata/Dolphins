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
  type?: string | null
  original_post_id?: string | null
  original_post?: PostWithDetails
  repost_user?: Profile
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

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      // 投稿とリポストを統合されたpostsテーブルから取得
      const { data, error, count } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) {
        console.error('Posts query error:', error)
        throw error
      }

      const posts = data || []

      // リポストの場合、original_postを取得
      for (const post of posts as any[]) {
        if (post.type === 'repost' && post.original_post_id) {
          const { data: originalPost } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(*),
              post_images(*),
              likes(count),
              comments(count)
            `)
            .eq('id', post.original_post_id)
            .single()

          if (originalPost) {
            post.original_post = originalPost
          }
        }
      }

      // いいね・リポスト状態を一括取得（N+1問題を回避）
      let userLikes: Set<string> = new Set()
      let userReposts: Set<string> = new Set()

      const allPostIds = posts.map((post: any) => post.id)

      if (currentUserId && allPostIds.length > 0) {
        // 一括でいいね状態を取得
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', allPostIds)

        userLikes = new Set((likesData || []).map((like: any) => like.post_id))

        // 一括でリポスト状態を取得（postsテーブル内のリポストをチェック）
        const { data: repostsData } = await supabase
          .from('posts')
          .select('original_post_id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .in('original_post_id', allPostIds)

        userReposts = new Set((repostsData || []).map((repost: any) => repost.original_post_id))
      }

      const postsWithDetails: PostWithDetails[] = posts.map((post: any) => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        post_images: Array.isArray(post.post_images)
          ? post.post_images.sort((a: any, b: any) => a.order_index - b.order_index)
          : [],
        likes_count: Array.isArray(post.likes) ? post.likes[0]?.count || 0 : 0,
        comments_count: Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0,
        reposts_count: Array.isArray(post.reposts) ? post.reposts[0]?.count || 0 : 0,
        is_liked: userLikes.has(post.id),
        is_reposted: userReposts.has(post.id),
      }))

      return {
        posts: postsWithDetails,
        nextPage: posts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined,
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 既にいいねされているか確認
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) {
        // 既にいいねされている場合は何もしない（正常終了）
        return { alreadyLiked: true }
      }

      const { data, error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId } as any)
        .select()
        .single()

      if (error) {
        console.error('いいね挿入エラー:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error: any) => {
      console.error('いいねエラー詳細:', {
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

// いいね解除
export function useUnlikePost() {
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
    mutationFn: async ({ postId, comment }: { postId: string; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // 既にリポスト済みか確認
      const { data: existingRepost } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'repost')
        .eq('original_post_id', postId)
        .maybeSingle()

      if (existingRepost) {
        throw new Error('既にリポストしています')
      }

      // リポスト投稿を作成
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: comment || null,
          type: 'repost',
          original_post_id: postId,
        } as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('リポストしました')
    },
    onError: (error) => {
      console.error('リポストエラー:', error)
      toast.error(error.message || 'リポストに失敗しました')
    },
  })
}

// リポスト解除
export function useUnrepost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // リポスト投稿を削除
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'repost')
        .eq('original_post_id', postId)

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

// 特定の投稿を取得
export function usePost(postId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count)
        `)
        .eq('id', postId)
        .single()

      if (error) {
        console.error('投稿取得エラー:', error)
        throw error
      }

      // いいね・リポスト状態を取得（最適化済み）
      let isLiked = false
      let isReposted = false

      if (currentUserId) {
        // いいね状態を取得
        const { data: likeResult } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', (data as any).id)
          .eq('user_id', currentUserId)
          .maybeSingle()

        isLiked = !!likeResult

        // リポスト状態を取得（postsテーブルから）
        const { data: repostResult } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .eq('original_post_id', (data as any).id)
          .maybeSingle()

        isReposted = !!repostResult
      }

      const postWithDetails: PostWithDetails = {
        ...(data as any),
        profiles: Array.isArray((data as any).profiles) ? (data as any).profiles[0] : (data as any).profiles,
        post_images: Array.isArray((data as any).post_images)
          ? (data as any).post_images.sort((a: any, b: any) => a.order_index - b.order_index)
          : [],
        likes_count: Array.isArray((data as any).likes) ? (data as any).likes[0]?.count || 0 : 0,
        comments_count: Array.isArray((data as any).comments) ? (data as any).comments[0]?.count || 0 : 0,
        reposts_count: Array.isArray((data as any).reposts) ? (data as any).reposts[0]?.count || 0 : 0,
        is_liked: isLiked,
        is_reposted: isReposted,
      }

      return postWithDetails
    },
    enabled: !!postId,
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

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      const { data, error, count } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      // いいね・リポスト状態を一括取得（N+1問題を回避）
      let userLikes: Set<string> = new Set()
      let userReposts: Set<string> = new Set()

      if (currentUserId && data && data.length > 0) {
        const postIds = data.map((post: any) => post.id)

        // 一括でいいね状態を取得
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)

        userLikes = new Set((likesData || []).map((like: any) => like.post_id))

        // 一括でリポスト状態を取得（postsテーブルから）
        const { data: repostsData } = await supabase
          .from('posts')
          .select('original_post_id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .in('original_post_id', postIds)

        userReposts = new Set((repostsData || []).map((repost: any) => repost.original_post_id))
      }

      const postsWithDetails: PostWithDetails[] = (data || []).map((post: any) => ({
        ...post,
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        post_images: Array.isArray(post.post_images)
          ? post.post_images.sort((a: any, b: any) => a.order_index - b.order_index)
          : [],
        likes_count: Array.isArray(post.likes) ? post.likes[0]?.count || 0 : 0,
        comments_count: Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0,
        reposts_count: Array.isArray(post.reposts) ? post.reposts[0]?.count || 0 : 0,
        is_liked: userLikes.has(post.id),
        is_reposted: userReposts.has(post.id),
      }))

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
