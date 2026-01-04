'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { CommentWithDetails } from '@/hooks/use-search'

interface CommentSearchResultProps {
  comment: CommentWithDetails
}

export function CommentSearchResult({ comment }: CommentSearchResultProps) {
  const router = useRouter()
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ja,
  })

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${comment.profiles?.username}`)
  }

  return (
    <Link href={`/home/${comment.post_id}`}>
      <Card className="p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer bg-white border-blue-100">
        <div className="flex items-start gap-3">
          <div onClick={handleAvatarClick} className="cursor-pointer">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100 hover:ring-blue-300 transition-colors">
              <AvatarImage src={comment.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-sky-400 text-white text-sm font-semibold">
                {comment.profiles?.display_name?.[0] ||
                  comment.profiles?.username?.[0] ||
                  'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {comment.profiles?.display_name || comment.profiles?.username}
              </p>
              <span className="text-xs text-gray-500">·</span>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
            <div className="flex items-start gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 break-words line-clamp-3">
                {comment.content}
              </p>
            </div>
            {comment.posts?.content && (
              <div className="mt-2 pl-6 border-l-2 border-blue-200">
                <p className="text-xs text-gray-500 mb-1">元の投稿:</p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {comment.posts.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
