'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { usePosts } from '@/hooks/use-posts'
import { PostCard } from './post-card'
import { PostSkeleton } from './post-skeleton'
import { Loader2 } from 'lucide-react'

export function PostFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = usePosts()
  const { ref, inView } = useInView()

  // 画面下部に到達したら次のページを読み込む
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">投稿の読み込みに失敗しました</p>
      </div>
    )
  }

  const posts = data?.pages.flatMap((page) => page.posts) || []

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">まだ投稿がありません</p>
        <p className="text-sm text-gray-400 mt-2">最初の投稿をしてみましょう！</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 無限スクロールのトリガー */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          )}
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-400">すべての投稿を表示しました</p>
        </div>
      )}
    </div>
  )
}
