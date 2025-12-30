'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { LoadingSpinner } from './loading-spinner'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface InfiniteScrollProps {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  threshold?: number
  loadingComponent?: React.ReactNode
  endComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  isError = false,
  onRetry,
  threshold = 0.1,
  loadingComponent,
  endComponent,
  errorComponent,
  className,
  children,
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold,
  })

  React.useEffect(() => {
    if (inView && hasMore && !isLoading && !isError) {
      onLoadMore()
    }
  }, [inView, hasMore, isLoading, isError, onLoadMore])

  const defaultLoadingComponent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center justify-center py-8"
    >
      <div className="flex items-center gap-3 text-gray-600">
        <LoadingSpinner size="md" />
        <span className="text-sm font-medium">読み込み中...</span>
      </div>
    </motion.div>
  )

  const defaultEndComponent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="h-px w-32 bg-gray-200 mb-4" />
      <p className="text-sm text-gray-500 font-medium">
        すべてのコンテンツを表示しました
      </p>
    </motion.div>
  )

  const defaultErrorComponent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="rounded-full bg-red-50 p-3 mb-4">
        <svg
          className="h-6 w-6 text-red-500"
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
      <p className="text-sm text-gray-700 font-medium mb-2">
        読み込みに失敗しました
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          再試行
        </Button>
      )}
    </motion.div>
  )

  return (
    <div className={cn('relative', className)}>
      {children}

      {/* Trigger Element */}
      <div ref={ref} className="h-1" />

      {/* Loading State */}
      {isLoading && hasMore && (loadingComponent || defaultLoadingComponent)}

      {/* Error State */}
      {isError && (errorComponent || defaultErrorComponent)}

      {/* End of Content */}
      {!isLoading && !isError && !hasMore && (endComponent || defaultEndComponent)}
    </div>
  )
}

interface InfiniteScrollContainerProps {
  children: React.ReactNode
  className?: string
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export function InfiniteScrollContainer({
  children,
  className,
  onScroll,
}: InfiniteScrollContainerProps) {
  return (
    <div
      className={cn('overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent', className)}
      onScroll={onScroll}
    >
      {children}
    </div>
  )
}
