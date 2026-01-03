import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { PostWithDetails } from '@/hooks/use-posts'

type Profile = Database['public']['Tables']['profiles']['Row']
type Comment = Database['public']['Tables']['comments']['Row']
type GroupPost = Database['public']['Tables']['group_posts']['Row']

export interface CommentWithDetails extends Comment {
  profiles: Profile
  post_id: string
  posts?: {
    id: string
    content: string | null
    user_id: string
  }
}

export interface GroupPostWithDetails extends GroupPost {
  profiles: Profile
  groups: {
    id: string
    name: string
    visibility_type: 'public' | 'private'
  }
  group_post_images?: Array<{
    id: string
    image_url: string
    order_index: number
  }>
}

const SEARCH_LIMIT = 20

/**
 * ユーザー検索フック
 * @param query - 検索クエリ（username または display_name で検索）
 * @returns ユーザー検索結果
 */
export function useSearchUsers(query: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search', 'users', query],
    queryFn: async () => {
      // クエリが空の場合は空配列を返す
      if (!query.trim()) {
        return []
      }

      // ユーザー名または表示名で検索（大文字小文字を区別しない）
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(SEARCH_LIMIT)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as Profile[]
    },
    enabled: query.trim().length > 0, // クエリが空でない場合のみ実行
  })
}

/**
 * コメント検索フック
 * @param query - 検索クエリ（コメント内容で検索）
 * @returns コメント検索結果
 */
export function useSearchComments(query: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search', 'comments', query],
    queryFn: async () => {
      // クエリが空の場合は空配列を返す
      if (!query.trim()) {
        return []
      }

      // コメント内容で検索（大文字小文字を区別しない）
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(*),
          posts!comments_post_id_fkey(id, content, user_id)
        `)
        .ilike('content', `%${query}%`)
        .limit(SEARCH_LIMIT)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((comment: any) => ({
        ...comment,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
        posts: Array.isArray(comment.posts) ? comment.posts[0] : comment.posts,
      })) as CommentWithDetails[]
    },
    enabled: query.trim().length > 0,
  })
}

/**
 * グループ投稿検索フック（権限管理付き）
 * @param query - 検索クエリ（グループ投稿内容で検索）
 * @returns グループ投稿検索結果（権限のあるもののみ）
 */
export function useSearchGroupPosts(query: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search', 'group-posts', query],
    queryFn: async () => {
      // クエリが空の場合は空配列を返す
      if (!query.trim()) {
        return []
      }

      const { data: session } = await supabase.auth.getSession()
      const currentUserId = session?.session?.user?.id

      // グループ投稿内容で検索
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          profiles!group_posts_user_id_fkey(*),
          groups!group_posts_group_id_fkey(id, name, visibility_type),
          group_post_images(*)
        `)
        .ilike('content', `%${query}%`)
        .not('content', 'is', null)
        .limit(SEARCH_LIMIT)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 権限チェック: 公開グループまたは自分が参加しているプライベートグループのみ
      const filteredPosts = await Promise.all(
        (data || []).map(async (post: any) => {
          const group = Array.isArray(post.groups) ? post.groups[0] : post.groups

          // 公開グループの場合はそのまま返す
          if (group.visibility_type === 'public') {
            return {
              ...post,
              profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
              groups: group,
              group_post_images: Array.isArray(post.group_post_images)
                ? post.group_post_images.sort((a: any, b: any) => a.order_index - b.order_index)
                : [],
            }
          }

          // プライベートグループの場合、メンバーシップをチェック
          if (currentUserId) {
            const { data: memberData } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', group.id)
              .eq('user_id', currentUserId)
              .eq('is_active', true)
              .single()

            if (memberData) {
              return {
                ...post,
                profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
                groups: group,
                group_post_images: Array.isArray(post.group_post_images)
                  ? post.group_post_images.sort((a: any, b: any) => a.order_index - b.order_index)
                  : [],
              }
            }
          }

          // 権限がない場合はnullを返す
          return null
        })
      )

      // nullを除外して返す
      return filteredPosts.filter((post) => post !== null) as GroupPostWithDetails[]
    },
    enabled: query.trim().length > 0,
  })
}

/**
 * 投稿検索フック
 * @param query - 検索クエリ（投稿内容で検索）
 * @returns 投稿検索結果
 */
export function useSearchPosts(query: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search', 'posts', query],
    queryFn: async () => {
      // クエリが空の場合は空配列を返す
      if (!query.trim()) {
        return []
      }

      const { data: session } = await supabase.auth.getSession()
      const currentUserId = session?.session?.user?.id

      // 投稿内容で検索（大文字小文字を区別しない）
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_images(*),
          likes(count),
          comments(count),
          reposts(count)
        `)
        .ilike('content', `%${query}%`)
        .not('content', 'is', null)
        .limit(SEARCH_LIMIT)
        .order('created_at', { ascending: false })

      if (error) throw error

      // いいね・リポスト状態を取得
      const postsWithDetails: PostWithDetails[] = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      return postsWithDetails
    },
    enabled: query.trim().length > 0, // クエリが空でない場合のみ実行
  })
}
