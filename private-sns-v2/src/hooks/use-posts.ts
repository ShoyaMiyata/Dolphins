import { useMutation, useQuery, useQueryClient, useInfiniteQuery, type QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type PostsSnapshot = ReadonlyArray<readonly [unknown, unknown]>

async function snapshotPostsQueries(queryClient: QueryClient): Promise<PostsSnapshot> {
  await queryClient.cancelQueries({ queryKey: ['posts'] })
  await queryClient.cancelQueries({ queryKey: ['userPosts'] })
  const a = queryClient.getQueriesData({ queryKey: ['posts'] })
  const b = queryClient.getQueriesData({ queryKey: ['userPosts'] })
  return [...a, ...b]
}

function rollbackPostsQueries(queryClient: QueryClient, snapshot: PostsSnapshot | undefined) {
  if (!snapshot) return
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key as readonly unknown[], data)
  }
}

function patchPostInQueries(
  queryClient: QueryClient,
  postId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: (post: any) => any
) {
  const apply = (old: any) => {
    if (!old?.pages) return old
    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        posts: Array.isArray(page.posts) ? page.posts.map((p: any) => (p.id === postId ? patch(p) : p)) : page.posts,
      })),
    }
  }
  queryClient.setQueriesData({ queryKey: ['posts'] }, apply)
  queryClient.setQueriesData({ queryKey: ['userPosts'] }, apply)
}

function removePostFromQueries(queryClient: QueryClient, postId: string) {
  const apply = (old: any) => {
    if (!old?.pages) return old
    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        posts: Array.isArray(page.posts) ? page.posts.filter((p: any) => p.id !== postId) : page.posts,
      })),
    }
  }
  queryClient.setQueriesData({ queryKey: ['posts'] }, apply)
  queryClient.setQueriesData({ queryKey: ['userPosts'] }, apply)
}

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
  original_post_id?: string | null
  original_group_post_id?: string | null
  original_post?: PostWithDetails
  original_group_post?: any
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

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
}

async function uploadImage(file: File, userId: string, signal?: AbortSignal): Promise<string> {
  const supabase = createClient()

  let toUpload: File = file
  try {
    const compressed = await imageCompression(file, {
      ...compressionOptions,
      signal,
    } as Parameters<typeof imageCompression>[1])
    toUpload = compressed
  } catch (err) {
    console.warn('image compression failed, using original file:', err)
    toUpload = file
  }

  const fileExt = toUpload.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, toUpload, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path)

  return publicUrl
}

async function uploadImagesWithLimit(
  files: File[],
  userId: string,
  bucket: 'post-images' | 'comment-images' | 'group-post-images' = 'post-images',
  concurrency = 2
): Promise<string[]> {
  const results: string[] = new Array(files.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
    while (cursor < files.length) {
      const i = cursor++
      results[i] = await uploadToBucket(files[i], userId, bucket)
    }
  })
  await Promise.all(workers)
  return results
}

async function uploadToBucket(
  file: File,
  userId: string,
  bucket: 'post-images' | 'comment-images' | 'group-post-images'
): Promise<string> {
  if (bucket === 'post-images') {
    return uploadImage(file, userId)
  }

  const supabase = createClient()
  let toUpload: File = file
  try {
    const compressed = await imageCompression(file, compressionOptions)
    toUpload = compressed
  } catch (err) {
    console.warn('image compression failed, using original file:', err)
    toUpload = file
  }

  const fileExt = toUpload.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, toUpload, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export function usePosts() {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = (pageParam as number) * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count),
          reposts:posts!original_post_id(count)
        `)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      const posts = data || []

      // リポストの場合、original_postを一括取得
      const originalPostIds = posts
        .filter((post: any) => post.type === 'repost' && post.original_post_id)
        .map((post: any) => post.original_post_id)

      if (originalPostIds.length > 0) {
        const { data: originalPostsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(*),
            post_images(*),
            likes(count),
            comments(count),
            reposts:posts!original_post_id(count)
          `)
          .in('id', originalPostIds)

        if (originalPostsData) {
          const originalPostsMap = new Map(originalPostsData.map((p: any) => [p.id, {
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            post_images: Array.isArray(p.post_images) ? p.post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: p.likes?.[0]?.count || 0,
            comments_count: p.comments?.[0]?.count || 0,
            reposts_count: p.reposts?.[0]?.count || 0
          }]))
          posts.forEach((post: any) => {
            if (post.type === 'repost' && post.original_post_id) {
              post.original_post = originalPostsMap.get(post.original_post_id)
            }
          })
        }
      }

      // グループ投稿のリポストの場合、original_group_postを一括取得
      const originalGroupPostIds = posts
        .filter((post: any) => post.type === 'repost' && post.original_group_post_id)
        .map((post: any) => post.original_group_post_id)

      if (originalGroupPostIds.length > 0) {
        const { data: originalGroupPostsData } = await supabase
          .from('group_posts')
          .select(`
            *,
            profiles:profiles!group_posts_user_id_fkey(*),
            group_post_images(*),
            group_post_likes(count),
            group_post_comments(count),
            reposts:posts!original_group_post_id(count)
          `)
          .in('id', originalGroupPostIds)

        if (originalGroupPostsData) {
          const originalGroupPostsMap = new Map(originalGroupPostsData.map((p: any) => [p.id, {
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            group_post_images: Array.isArray(p.group_post_images) ? p.group_post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: p.group_post_likes?.[0]?.count || 0,
            comments_count: p.group_post_comments?.[0]?.count || 0,
            reposts_count: p.reposts?.[0]?.count || 0
          }]))
          posts.forEach((post: any) => {
            if (post.type === 'repost' && post.original_group_post_id) {
              post.original_group_post = originalGroupPostsMap.get(post.original_group_post_id)
            }
          })
        }
      }

      let userLikes: Set<string> = new Set()
      let userReposts: Set<string> = new Set()

      const allPostIds = posts.map((post: any) => post.id)

      if (currentUserId && allPostIds.length > 0) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', allPostIds)

        userLikes = new Set((likesData || []).map((like: any) => like.post_id))

        const { data: repostsData } = await supabase
          .from('posts')
          .select('original_post_id, original_group_post_id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .or(`original_post_id.in.(${allPostIds.join(',')}),original_group_post_id.in.(${allPostIds.join(',')})`)

        const allRepostedIds = (repostsData || []).flatMap((repost: any) => [
          repost.original_post_id,
          repost.original_group_post_id
        ]).filter(Boolean)
        userReposts = new Set(allRepostedIds)
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
        nextPage: posts.length === POSTS_PER_PAGE ? (pageParam as number) + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const timeoutMs = 30_000
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('投稿処理がタイムアウトしました')), timeoutMs)
      )

      const work = (async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('ログインが必要です')

        const userId = user.id

        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            content: data.content || null,
          } as any)
          .select()
          .single()

        if (postError) throw postError

        if (data.images && data.images.length > 0) {
          const imageUrls = await uploadImagesWithLimit(data.images, userId, 'post-images')

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
      })()

      return Promise.race([work, timeout])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
      toast.success('投稿しました')
    },
    onError: (error) => {
      console.error('投稿エラー:', error)
      toast.error(error instanceof Error ? error.message : '投稿に失敗しました')
    },
  })
}

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
    onMutate: async ({ postId, content }) => {
      const snapshot = await snapshotPostsQueries(queryClient)
      patchPostInQueries(queryClient, postId, (post) => ({
        ...post,
        content,
        updated_at: new Date().toISOString(),
      }))
      return { snapshot }
    },
    onError: (error, _vars, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      console.error('更新エラー:', error)
      toast.error('更新に失敗しました')
    },
    onSuccess: () => {
      toast.success('投稿を更新しました')
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: images } = await supabase
        .from('post_images')
        .select('image_url')
        .eq('post_id', postId)

      if (images && images.length > 0) {
        const imagePaths = images.map((img: any) => {
          const url = new URL(img.image_url)
          return url.pathname.split('/post-images/')[1]
        })

        await supabase.storage
          .from('post-images')
          .remove(imagePaths)
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
    },
    onMutate: async (postId) => {
      const snapshot = await snapshotPostsQueries(queryClient)
      removePostFromQueries(queryClient, postId)
      return { snapshot }
    },
    onError: (error, _postId, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      console.error('削除エラー:', error)
      toast.error('削除に失敗しました')
    },
    onSuccess: () => {
      toast.success('投稿を削除しました')
    },
  })
}

export function useLikePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingLike) return { alreadyLiked: true }

      const { data, error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId } as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (postId) => {
      const snapshot = await snapshotPostsQueries(queryClient)
      patchPostInQueries(queryClient, postId, (post) =>
        post.is_liked ? post : { ...post, is_liked: true, likes_count: (post.likes_count || 0) + 1 }
      )
      return { snapshot }
    },
    onError: (error: any, _postId, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      toast.error(error?.message || 'いいねに失敗しました')
    },
  })
}

export function useUnlikePost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onMutate: async (postId) => {
      const snapshot = await snapshotPostsQueries(queryClient)
      patchPostInQueries(queryClient, postId, (post) =>
        !post.is_liked ? post : { ...post, is_liked: false, likes_count: Math.max(0, (post.likes_count || 0) - 1) }
      )
      return { snapshot }
    },
    onError: (error, _postId, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      console.error('いいね解除エラー:', error)
      toast.error('いいね解除に失敗しました')
    },
  })
}

export function useRepost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ postId, groupPostId, comment }: { postId?: string; groupPostId?: string; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      const query = supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'repost')

      if (postId) {
        query.eq('original_post_id', postId)
      } else if (groupPostId) {
        query.eq('original_group_post_id', groupPostId)
      }

      const { data: existingRepost } = await query.maybeSingle()
      if (existingRepost) throw new Error('既にリポストしています')

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: comment || null,
          type: 'repost',
          original_post_id: postId || null,
          original_group_post_id: groupPostId || null,
        } as any)

      if (error) throw error
    },
    onMutate: async ({ postId, groupPostId }) => {
      const target = postId || groupPostId
      if (!target) return { snapshot: undefined }
      const snapshot = await snapshotPostsQueries(queryClient)
      patchPostInQueries(queryClient, target, (post) =>
        post.is_reposted ? post : { ...post, is_reposted: true, reposts_count: (post.reposts_count || 0) + 1 }
      )
      return { snapshot }
    },
    onError: (error, _vars, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      console.error('リポストエラー:', error)
      toast.error(error.message || 'リポストに失敗しました')
    },
    onSuccess: () => {
      toast.success('リポストしました')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
    },
  })
}

export function useUnrepost() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'repost')
        .or(`original_post_id.eq.${postId},original_group_post_id.eq.${postId}`)

      if (error) throw error
    },
    onMutate: async (postId) => {
      const snapshot = await snapshotPostsQueries(queryClient)
      patchPostInQueries(queryClient, postId, (post) =>
        !post.is_reposted ? post : { ...post, is_reposted: false, reposts_count: Math.max(0, (post.reposts_count || 0) - 1) }
      )
      return { snapshot }
    },
    onError: (error, _postId, context) => {
      rollbackPostsQueries(queryClient, context?.snapshot)
      console.error('リポスト解除エラー:', error)
      toast.error('リポスト解除に失敗しました')
    },
    onSuccess: () => {
      toast.success('リポストを解除しました')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
    },
  })
}

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
          comments(count),
          reposts:posts!original_post_id(count)
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      let isLiked = false
      let isReposted = false

      if (currentUserId) {
        const { data: likeResult } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', (data as any).id)
          .eq('user_id', currentUserId)
          .maybeSingle()

        isLiked = !!likeResult

        const { data: repostResult } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .or(`original_post_id.eq.${(data as any).id},original_group_post_id.eq.${(data as any).id}`)
          .maybeSingle()

        isReposted = !!repostResult
      }

      let originalPost = null
      if ((data as any).type === 'repost' && (data as any).original_post_id) {
        const { data: originalPostData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(*),
            post_images(*),
            likes(count),
            comments(count),
            reposts:posts!original_post_id(count)
          `)
          .eq('id', (data as any).original_post_id)
          .single()

        if (originalPostData) {
          originalPost = {
            ...(originalPostData as any),
            profiles: Array.isArray((originalPostData as any).profiles) ? (originalPostData as any).profiles[0] : (originalPostData as any).profiles,
            post_images: Array.isArray((originalPostData as any).post_images) ? (originalPostData as any).post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: (originalPostData as any).likes?.[0]?.count || 0,
            comments_count: (originalPostData as any).comments?.[0]?.count || 0,
            reposts_count: (originalPostData as any).reposts?.[0]?.count || 0
          }
        }
      }

      let originalGroupPost = null
      if ((data as any).type === 'repost' && (data as any).original_group_post_id) {
        const { data: groupPostData } = await supabase
          .from('group_posts')
          .select(`
            *,
            profiles:profiles!group_posts_user_id_fkey(*),
            group_post_images(*),
            group_post_likes(count),
            group_post_comments(count),
            reposts:posts!original_group_post_id(count)
          `)
          .eq('id', (data as any).original_group_post_id)
          .single()

        if (groupPostData) {
          originalGroupPost = {
            ...(groupPostData as any),
            profiles: Array.isArray((groupPostData as any).profiles) ? (groupPostData as any).profiles[0] : (groupPostData as any).profiles,
            group_post_images: Array.isArray((groupPostData as any).group_post_images) ? (groupPostData as any).group_post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: (groupPostData as any).group_post_likes?.[0]?.count || 0,
            comments_count: (groupPostData as any).group_post_comments?.[0]?.count || 0,
            reposts_count: (groupPostData as any).reposts?.[0]?.count || 0
          }
        }
      }

      const postWithDetails: PostWithDetails = {
        ...(data as any),
        original_post: originalPost,
        original_group_post: originalGroupPost,
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

export function useUserPosts(params: { userId?: string | null; username?: string | null }) {
  const { userId, username } = params
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['userPosts', { userId, username }],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId && !username) {
        return {
          posts: [],
          nextPage: undefined,
        }
      }

      const start = (pageParam as number) * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1

      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey!inner(*),
          post_images(*),
          likes(count),
          comments(count),
          reposts:posts!original_post_id(count)
        `)

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (username) {
        query = query.eq('profiles.username', username)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(start, end)

      if (error) throw error

      const posts = data || []

      const originalPostIds = posts
        .filter((post: any) => post.type === 'repost' && post.original_post_id)
        .map((post: any) => post.original_post_id)

      if (originalPostIds.length > 0) {
        const { data: originalPostsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(*),
            post_images(*),
            likes(count),
            comments(count),
            reposts:posts!original_post_id(count)
          `)
          .in('id', originalPostIds)

        if (originalPostsData) {
          const originalPostsMap = new Map(originalPostsData.map((p: any) => [p.id, {
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            post_images: Array.isArray(p.post_images) ? p.post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: p.likes?.[0]?.count || 0,
            comments_count: p.comments?.[0]?.count || 0,
            reposts_count: p.reposts?.[0]?.count || 0
          }]))
          posts.forEach((post: any) => {
            if (post.type === 'repost' && post.original_post_id) {
              post.original_post = originalPostsMap.get(post.original_post_id)
            }
          })
        }
      }

      const originalGroupPostIds = posts
        .filter((post: any) => post.type === 'repost' && post.original_group_post_id)
        .map((post: any) => post.original_group_post_id)

      if (originalGroupPostIds.length > 0) {
        const { data: originalGroupPostsData } = await supabase
          .from('group_posts')
          .select(`
            *,
            profiles:profiles!group_posts_user_id_fkey(*),
            group_post_images(*),
            group_post_likes(count),
            group_post_comments(count),
            reposts:posts!original_group_post_id(count)
          `)
          .in('id', originalGroupPostIds)

        if (originalGroupPostsData) {
          const originalGroupPostsMap = new Map(originalGroupPostsData.map((p: any) => [p.id, {
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            group_post_images: Array.isArray(p.group_post_images) ? p.group_post_images.sort((a: any, b: any) => a.order_index - b.order_index) : [],
            likes_count: p.group_post_likes?.[0]?.count || 0,
            comments_count: p.group_post_comments?.[0]?.count || 0,
            reposts_count: p.reposts?.[0]?.count || 0
          }]))
          posts.forEach((post: any) => {
            if (post.type === 'repost' && post.original_group_post_id) {
              post.original_group_post = originalGroupPostsMap.get(post.original_group_post_id)
            }
          })
        }
      }

      let userLikes: Set<string> = new Set()
      let userReposts: Set<string> = new Set()

      const allPostIds = posts.map((post: any) => post.id)

      if (currentUserId && allPostIds.length > 0) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', allPostIds)

        userLikes = new Set((likesData || []).map((like: any) => like.post_id))

        const { data: repostsData } = await supabase
          .from('posts')
          .select('original_post_id, original_group_post_id')
          .eq('user_id', currentUserId)
          .eq('type', 'repost')
          .or(`original_post_id.in.(${allPostIds.join(',')}),original_group_post_id.in.(${allPostIds.join(',')})`)

        const allRepostedIds = (repostsData || []).flatMap((repost: any) => [
          repost.original_post_id,
          repost.original_group_post_id
        ]).filter(Boolean)
        userReposts = new Set(allRepostedIds)
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
        nextPage: posts.length === POSTS_PER_PAGE ? (pageParam as number) + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId || !!username,
  })
}
