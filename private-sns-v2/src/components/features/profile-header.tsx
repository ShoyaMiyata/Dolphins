'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFollow, useUnfollow, useIsFollowing, useFollowerCount, useFollowingCount } from '@/hooks/use-follows'
import { useUser } from '@/hooks/use-user'
import type { Profile } from '@/lib/supabase/auth'
import { Calendar, Edit, Camera, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user: currentUser, uploadAvatar, updateProfile } = useUser()
  const isOwnProfile = currentUser?.id === profile.id

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // クライアントサイドでマウントされたことを検知
  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: isFollowing, isLoading: isFollowingLoading } = useIsFollowing(profile.id)
  const { data: followerCount = 0 } = useFollowerCount(profile.id)
  const { data: followingCount = 0 } = useFollowingCount(profile.id)

  const follow = useFollow()
  const unfollow = useUnfollow()

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollow.mutateAsync(profile.id)
    } else {
      await follow.mutateAsync(profile.id)
    }
  }

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください')
      return
    }

    setIsUpdating(true)
    const result = await uploadAvatar(file)
    setIsUpdating(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNameClick = () => {
    if (isOwnProfile) {
      setDisplayName(profile.display_name || '')
      setIsNameDialogOpen(true)
    }
  }

  const handleNameUpdate = async () => {
    setIsUpdating(true)
    const result = await updateProfile({
      display_name: displayName.trim() || null,
    })
    setIsUpdating(false)

    if (result.success) {
      setIsNameDialogOpen(false)
    }
  }

  const joinedDate = profile.created_at
    ? format(new Date(profile.created_at), 'yyyy年M月', { locale: ja })
    : ''

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-blue-100 hover:border-blue-200 mb-4">
        <CardContent className="p-0">
          {/* カバー画像（Dolphinsテーマ） */}
          <div className="h-32 sm:h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600" />

          <div className="px-4 pb-4">
            {/* アバターとボタン */}
            <div className="flex items-start justify-between -mt-16 sm:-mt-20">
              <div
                className={`relative ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white ring-4 ring-blue-100 shadow-lg hover:opacity-80 transition-opacity">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl sm:text-4xl bg-blue-100 text-blue-600">
                    {profile.display_name?.[0] || profile.username[0]}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="absolute bottom-0 right-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg pointer-events-none">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                )}
                {isUpdating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full pointer-events-none">
                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-white" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* ボタンエリア - クライアントサイドでのみ表示してハイドレーションミスマッチを回避 */}
              <div className="mt-16 sm:mt-20 min-h-[40px]">
                {mounted && currentUser && isOwnProfile && (
                  <Link href="/profile/edit">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                      プロフィール編集
                    </Button>
                  </Link>
                )}
                {mounted && currentUser && !isOwnProfile && (
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={isFollowingLoading || follow.isPending || unfollow.isPending}
                    className={`min-w-[100px] rounded-full ${
                      isFollowing
                        ? 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {follow.isPending || unfollow.isPending
                      ? '処理中...'
                      : isFollowing
                        ? 'フォロー中'
                        : 'フォロー'}
                  </Button>
                )}
              </div>
            </div>

            {/* ユーザー情報 */}
            <div className="mt-4 space-y-3">
              <div>
                <h1
                  className={`text-xl font-bold text-blue-900 ${
                    isOwnProfile ? 'cursor-pointer hover:text-blue-700 transition-colors' : ''
                  }`}
                  onClick={handleNameClick}
                >
                  {profile.display_name || profile.username}
                  {isOwnProfile && <Edit className="inline h-4 w-4 ml-2 text-blue-500" />}
                </h1>
                <p className="text-sm text-blue-600">@{profile.username}</p>
              </div>

            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap break-words text-gray-700">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-blue-600">
              {joinedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>{joinedDate}に登録</span>
                </div>
              )}
            </div>

            {/* フォロー・フォロワー数 */}
            <div className="flex items-center gap-4 text-sm">
              <button className="hover:underline transition-colors">
                <span className="font-bold text-blue-900">{followingCount}</span>
                <span className="text-blue-600 ml-1">フォロー中</span>
              </button>
              <button className="hover:underline transition-colors">
                <span className="font-bold text-blue-900">{followerCount}</span>
                <span className="text-blue-600 ml-1">フォロワー</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 名前変更ダイアログ */}
    <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-blue-900">表示名を変更</DialogTitle>
          <DialogDescription className="text-sm text-blue-600">
            あなたのプロフィールに表示される名前を変更できます
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder="表示名を入力"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="border-blue-100 focus:border-blue-300 focus:ring-blue-200"
          />
          <p className="text-sm text-blue-600">{displayName.length} / 50</p>
        </div>
        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setIsNameDialogOpen(false)}
            disabled={isUpdating}
            className="flex-1 rounded-lg border-blue-100"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleNameUpdate}
            disabled={isUpdating || displayName.length > 50}
            className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
