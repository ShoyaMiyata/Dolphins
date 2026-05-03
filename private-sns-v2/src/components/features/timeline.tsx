'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2 } from 'lucide-react'
import { usePosts } from '@/hooks/use-posts'
import PostCard from './post-card'
import { PostSkeleton } from './post-skeleton'
import { PostEmptyState } from './post-empty-state'
import { PostErrorState } from './post-error-state'

export function Timeline() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePosts()

  const { ref: inViewRef, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((page) => page.posts) || []

  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return <PostErrorState onRetry={() => refetch()} isRetrying={isFetching} />
  }

  if (posts.length === 0) {
    return <PostEmptyState />
  }

  return (
    <div className="relative">
      {isFetching && !isFetchingNextPage && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            更新中...
          </div>
        </div>
      )}

      <div className="space-y-0">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {hasNextPage && (
          <div ref={inViewRef} className="flex justify-center p-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            )}
          </div>
        )}

        {!hasNextPage && posts.length > 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="h-px w-32 bg-border mb-4" />
            <p className="text-sm text-muted-foreground">
              すべての投稿を表示しました
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
