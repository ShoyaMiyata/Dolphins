'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserSearchResultProps {
  user: Profile
}

export function UserSearchResult({ user }: UserSearchResultProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // ユーザー名の最大文字数
  const truncateBio = (bio: string | null, maxLength: number = 100) => {
    if (!bio) return ''
    return bio.length > maxLength ? `${bio.slice(0, maxLength)}...` : bio
  }

  // プロフィールページに遷移
  const handleNavigateToProfile = () => {
    router.push(`/profile/${user.username}`)
  }

  // フォロー/フォロー解除処理（後で実装）
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // カード全体のクリックイベントを防ぐ
    setIsLoading(true)

    try {
      // TODO: フォロー/フォロー解除のAPI呼び出しを実装
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('フォロー処理エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3 border border-gray-100"
      onClick={handleNavigateToProfile}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* アバター */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {user.display_name?.[0] || user.username[0]}
            </AvatarFallback>
          </Avatar>

          {/* ユーザー情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {user.display_name || user.username}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  @{user.username}
                </p>
              </div>

              {/* フォローボタン */}
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={handleFollowToggle}
                disabled={isLoading}
                className="flex-shrink-0 rounded-full"
              >
                {isLoading ? '処理中...' : isFollowing ? 'フォロー中' : 'フォロー'}
              </Button>
            </div>

            {/* 自己紹介 */}
            {user.bio && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {truncateBio(user.bio)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
