'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFollowers, useFollowing, useIsFollowing, useFollow, useUnfollow } from '@/hooks/use-follows'
import { useUser } from '@/hooks/use-user'
import type { FollowUser } from '@/hooks/use-follows'
import { Loader2, Users, UserPlus, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface FollowListDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'followers' | 'following'
}

export function FollowListDialog({ userId, open, onOpenChange, defaultTab = 'followers' }: FollowListDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { data: followers = [], isLoading: isLoadingFollowers } = useFollowers(userId)
  const { data: following = [], isLoading: isLoadingFollowing } = useFollowing(userId)
  const { user: currentUser } = useUser()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border-2 border-blue-200 bg-white p-0 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ヘッダーグラデーション - Dolphins Theme */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600 px-6 pt-6 pb-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
          <DialogHeader className="relative">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              フォロー・フォロワー
            </DialogTitle>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followers' | 'following')} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b-2 border-blue-100 bg-gray-50 px-6 shadow-sm">
            <TabsTrigger
              value="followers"
              className="flex-1 py-3 data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-3 data-[state=active]:border-blue-500 data-[state=active]:shadow-sm text-blue-700 font-semibold transition-all hover:text-blue-600 hover:bg-blue-50/50 rounded-t-lg"
            >
              <Users className="h-4 w-4 mr-2" />
              フォロワー ({followers.length})
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 py-3 data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-3 data-[state=active]:border-blue-500 data-[state=active]:shadow-sm text-blue-700 font-semibold transition-all hover:text-blue-600 hover:bg-blue-50/50 rounded-t-lg"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              フォロー中 ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="flex-1 overflow-y-auto px-6 pb-6 mt-0 bg-gray-50/30">
            {isLoadingFollowers ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                  <Loader2 className="relative h-10 w-10 animate-spin text-blue-500" />
                </div>
                <p className="text-sm text-blue-600 font-medium">読み込み中...</p>
              </div>
            ) : followers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-blue-600 font-medium">フォロワーがいません</p>
                <p className="text-sm text-blue-500/70">投稿を増やしてフォロワーを獲得しましょう</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {followers.map((user, index) => (
                  <FollowUserItem
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id || null}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="flex-1 overflow-y-auto px-6 pb-6 mt-0 bg-gray-50/30">
            {isLoadingFollowing ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                  <Loader2 className="relative h-10 w-10 animate-spin text-blue-500" />
                </div>
                <p className="text-sm text-blue-600 font-medium">読み込み中...</p>
              </div>
            ) : following.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-blue-600 font-medium">フォロー中のユーザーがいません</p>
                <p className="text-sm text-blue-500/70">興味のあるユーザーをフォローしましょう</p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {following.map((user, index) => (
                  <FollowUserItem
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id || null}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

interface FollowUserItemProps {
  user: FollowUser
  currentUserId: string | null
  index?: number
}

function FollowUserItem({ user, currentUserId, index = 0 }: FollowUserItemProps) {
  const { data: isFollowing = false } = useIsFollowing(user.id)
  const follow = useFollow()
  const unfollow = useUnfollow()
  const isOwnProfile = currentUserId === user.id

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isFollowing) {
      await unfollow.mutateAsync(user.id)
    } else {
      await follow.mutateAsync(user.id)
    }
  }

  return (
    <div 
      className="flex items-center justify-between py-3.5 px-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 rounded-xl transition-all duration-200 border border-blue-100/50 hover:border-blue-200 hover:shadow-md group"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-blue-100 ring-2 ring-blue-50 group-hover:ring-blue-100 transition-all">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100 to-sky-100 text-blue-600 font-semibold">
              {user.display_name?.[0] || user.username[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-blue-900 truncate group-hover:text-blue-700 transition-colors">
            {user.display_name || user.username}
          </p>
          <p className="text-sm text-blue-600/80 truncate">@{user.username}</p>
        </div>
      </Link>
      {!isOwnProfile && currentUserId && (
        <Button
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          onClick={handleFollowToggle}
          disabled={follow.isPending || unfollow.isPending}
          className={`ml-3 rounded-full shrink-0 font-semibold transition-all duration-200 ${
            isFollowing
              ? 'border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 bg-white'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5'
          }`}
        >
          {follow.isPending || unfollow.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              処理中
            </>
          ) : isFollowing ? (
            <>
              <UserCheck className="h-3.5 w-3.5 mr-1" />
              フォロー中
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              フォロー
            </>
          )}
        </Button>
      )}
    </div>
  )
}
