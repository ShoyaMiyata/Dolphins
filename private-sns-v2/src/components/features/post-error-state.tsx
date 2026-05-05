'use client'

import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onRetry: () => void
  isRetrying?: boolean
}

export function PostErrorState({ onRetry, isRetrying }: Props) {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-base font-semibold mb-1">読み込めませんでした</h3>
      <p className="text-sm text-muted-foreground mb-4">
        通信状態を確認してもう一度試してください
      </p>
      <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isRetrying ? '読み込み中...' : '再読み込み'}
      </Button>
    </div>
  )
}
