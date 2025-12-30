'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import { usePosts } from '@/hooks/use-posts'
import { PostCard } from './post-card'
import { PostSkeleton } from './post-skeleton'
import { Button } from '@/components/ui/button'

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

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
  })

  const parentRef = useRef<HTMLDivElement>(null)

  // 無限スクロール: 画面下部に到達したら次のページを読み込む
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // データを平坦化
  const posts = data?.pages.flatMap((page) => page.posts) || []

  // バーチャルスクロールの設定
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 各投稿の推定高さ（px）
    overscan: 5, // 画面外にレンダリングする要素数
  })

  // ローディング状態
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  // エラー状態
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center"
      >
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <svg
            className="h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">投稿の読み込みに失敗しました</h3>
        <p className="text-sm text-muted-foreground mb-4">
          もう一度お試しください
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          再読み込み
        </Button>
      </motion.div>
    )
  }

  // 空の状態
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center"
      >
        <div className="rounded-full bg-blue-50 p-4 mb-4">
          <svg
            className="h-12 w-12 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">まだ投稿がありません</h3>
        <p className="text-sm text-muted-foreground">
          最初の投稿をしてみましょう！
        </p>
      </motion.div>
    )
  }

  return (
    <div className="relative">
      {/* リフレッシュインジケーター */}
      {isFetching && !isFetchingNextPage && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            更新中...
          </div>
        </div>
      )}

      {/* タイムライン */}
      <div className="space-y-0">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* 無限スクロールのトリガー */}
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

        {/* すべて表示済み */}
        {!hasNextPage && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="h-px w-32 bg-border mb-4" />
            <p className="text-sm text-muted-foreground">
              すべての投稿を表示しました
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
