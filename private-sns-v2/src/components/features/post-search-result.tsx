'use client'

import { PostCard } from './post-card'
import type { PostWithDetails } from '@/hooks/use-posts'

interface PostSearchResultProps {
  post: PostWithDetails
}

/**
 * 投稿検索結果コンポーネント
 * 既存のPostCardコンポーネントを再利用
 */
export function PostSearchResult({ post }: PostSearchResultProps) {
  return <PostCard post={post} />
}
