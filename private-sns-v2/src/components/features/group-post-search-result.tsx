'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { GroupPostWithDetails } from '@/hooks/use-search'
import Image from 'next/image'

interface GroupPostSearchResultProps {
  post: GroupPostWithDetails
}

export function GroupPostSearchResult({ post }: GroupPostSearchResultProps) {
  const router = useRouter()
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ja,
  })

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${post.profiles?.username}`)
  }

  return (
    <Link href={`/groups/${post.group_id}`}>
      <Card className="p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer bg-white border-blue-100">
        <div className="flex items-start gap-3">
          <div onClick={handleAvatarClick} className="cursor-pointer">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100 hover:ring-blue-300 transition-colors">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-sky-400 text-white text-sm font-semibold">
                {post.profiles?.display_name?.[0] ||
                  post.profiles?.username?.[0] ||
                  'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {post.profiles?.display_name || post.profiles?.username}
              </p>
              <span className="text-xs text-gray-500">·</span>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="flex items-center gap-1 text-xs border-blue-200 text-blue-700">
                {post.groups.visibility_type === 'private' ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {post.groups.name}
              </Badge>
            </div>
            {post.content && (
              <p className="text-sm text-gray-700 break-words line-clamp-3 mb-2">
                {post.content}
              </p>
            )}
            {post.group_post_images && post.group_post_images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {post.group_post_images.slice(0, 4).map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={image.image_url}
                      alt={`グループ投稿画像 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {index === 3 && post.group_post_images!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <p className="text-white font-semibold text-lg">
                          +{post.group_post_images!.length - 4}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
