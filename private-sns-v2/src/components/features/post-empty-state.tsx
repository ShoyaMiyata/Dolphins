'use client'

import { MessageCircle } from 'lucide-react'

export function PostEmptyState() {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <MessageCircle className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-base font-semibold mb-1">まだ投稿がありません</h3>
      <p className="text-sm text-muted-foreground">
        最初の投稿をしてフィードを始めよう
      </p>
    </div>
  )
}
