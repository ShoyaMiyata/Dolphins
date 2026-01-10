'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Home as HomeIcon, LogOut, ExternalLink, MessageSquare, Users, Plus, ChevronDown, ChevronRight, Globe, Lock, RotateCcw, Shield, User, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGroups, useCreateGroup } from '@/hooks/use-groups'
import { useAdmin } from '@/hooks/use-admin'
import { useTrackLastAccess } from '@/hooks/use-user'
import { Image as ImageIcon } from 'lucide-react'

interface AppHeaderProps {
  groupName?: string
  icon?: LucideIcon
}

export function AppHeader({ groupName, icon: Icon }: AppHeaderProps) {
  const [open, setOpen] = useState(false)
  const [groupsExpanded, setGroupsExpanded] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [joinType, setJoinType] = useState<'free' | 'approval'>('free')
  const [visibilityType, setVisibilityType] = useState<'public' | 'private'>('public')
  const [isReloading, setIsReloading] = useState(false)

  const user = useAuthStore((state) => state.user)
  const reset = useAuthStore((state) => state.reset)
  const router = useRouter()
  const supabase = createClient()

  const { data: groups, isLoading: groupsLoading } = useGroups()
  const createGroup = useCreateGroup()
  const { isAdmin } = useAdmin()

  // 自動アクセス時刻更新
  useTrackLastAccess()

  // アイコン画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    setGroupImage(file)
    const preview = URL.createObjectURL(file)
    setGroupImagePreview(preview)
  }

  // カバー画像選択処理
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください')
      return
    }

    setCoverImage(file)
    const preview = URL.createObjectURL(file)
    setCoverImagePreview(preview)
  }

  // アイコン画像削除処理
  const handleImageRemove = () => {
    if (groupImagePreview) {
      URL.revokeObjectURL(groupImagePreview)
    }
    setGroupImage(null)
    setGroupImagePreview(null)
  }

  // カバー画像削除処理
  const handleCoverImageRemove = () => {
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview)
    }
    setCoverImage(null)
    setCoverImagePreview(null)
  }

  // グループ作成処理
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    await createGroup.mutateAsync({
      name: newGroupName,
      description: groupDescription || undefined,
      image: groupImage || undefined,
      coverImage: coverImage || undefined,
      joinType,
      visibilityType,
    })

    // フォームをリセット
    setIsCreateDialogOpen(false)
    setNewGroupName('')
    setGroupDescription('')
    handleImageRemove()
    handleCoverImageRemove()
    setJoinType('free')
    setVisibilityType('public')
  }

  const handleLogout = () => {
    console.log('ログアウト処理開始')

    // signOutをバックグラウンドで実行（待たない）
    supabase.auth.signOut().catch((error) => {
      console.error('signOutエラー:', error)
    })

    // すぐに状態をクリアして遷移
    reset()
    setOpen(false)

    // クッキーも削除
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })

    console.log('ログインページに遷移')
    window.location.href = '/login'
  }

  const handleReload = () => {
    setIsReloading(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Hamburger Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-blue-600">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-lg">メニュー</SheetTitle>
              </SheetHeader>

              <div className="space-y-3">
                {/* Menu Items */}
                <div className="space-y-1">
                  <Link href="/home" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-base">
                      <HomeIcon className="h-5 w-5" />
                      ホーム
                    </Button>
                  </Link>

                  <Link href="/landing" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-base">
                      <ExternalLink className="h-5 w-5" />
                      ランディングページ
                    </Button>
                  </Link>

                  <Link href="/feedback" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-base">
                      <MessageSquare className="h-5 w-5" />
                      改善要望
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-base text-red-600">
                        <Shield className="h-5 w-5" />
                        管理者パネル
                      </Button>
                    </Link>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Groups Section */}
                <div className="space-y-1">
                  {/* Groups Header */}
                  <div className="flex items-center justify-between px-2">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start gap-2 text-base font-semibold"
                      onClick={() => setGroupsExpanded(!groupsExpanded)}
                    >
                      {groupsExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Users className="h-5 w-5" />
                      グループ
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setIsCreateDialogOpen(true)
                        setOpen(false)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Groups List */}
                  {groupsExpanded && (
                    <div className="pl-4 space-y-1 max-h-[200px] overflow-y-auto">
                      {groupsLoading ? (
                        <div className="text-sm text-gray-500 px-2 py-1">読み込み中...</div>
                      ) : !groups || groups.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2 py-1">グループがありません</div>
                      ) : (
                        groups.map((group) => (
                          <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            onClick={() => setOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start gap-2 text-sm h-9">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {group.image_url ? (
                                  <img
                                    src={group.image_url}
                                    alt={group.name}
                                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <span className="truncate">{group.name}</span>
                                {group.visibility_type === 'private' && (
                                  <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                            </Button>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('ログアウトボタンがクリックされました')
                    handleLogout()
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  ログアウト
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/images/logo-text.png"
              alt="Dolphins B.B.C."
              width={160}
              height={50}
              className="h-12 w-auto object-contain logo-blue-filter"
              priority
            />
          </div>

          {/* Reload Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReload}
            disabled={isReloading}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="リロード"
          >
            <RotateCcw className={`h-6 w-6 ${isReloading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* グループ作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-lg max-h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-white via-blue-50 to-white border-0 shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-sky-600 text-white p-6 pb-4 rounded-t-3xl">
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <Plus className="h-6 w-6 text-white" />
              </div>
              グループを作成
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-center mt-2">
              新しいグループを作成して、メンバーと交流しましょう
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6 overflow-y-auto flex-1 px-6">
            {/* アイコン画像 */}
            <div className="space-y-3 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
              <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                グループアイコン
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl overflow-hidden border-2 border-blue-200 flex-shrink-0">
                  {groupImagePreview ? (
                    <img
                      src={groupImagePreview}
                      alt="アイコン画像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-400">
                      <Users className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('create-group-icon-input')?.click()}
                    className="text-sm"
                  >
                    アイコンを選択
                  </Button>
                  {groupImagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImageRemove}
                      className="text-sm text-red-600"
                    >
                      削除
                    </Button>
                  )}
                </div>
              </div>
              <input
                id="create-group-icon-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <p className="text-xs text-gray-500">
                推奨: 正方形の画像、最大5MB
              </p>
            </div>

            {/* カバー画像 */}
            <div className="space-y-3 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
              <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                </div>
                カバー画像
              </Label>
              <div className="relative w-full h-32 bg-gradient-to-r from-blue-100 to-sky-100 rounded-xl overflow-hidden border-2 border-blue-200">
                {coverImagePreview ? (
                  <img
                    src={coverImagePreview}
                    alt="カバー画像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('create-group-cover-input')?.click()}
                  className="text-sm"
                >
                  カバー画像を選択
                </Button>
                {coverImagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCoverImageRemove}
                    className="text-sm text-red-600"
                  >
                    削除
                  </Button>
                )}
              </div>
              <input
                id="create-group-cover-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageSelect}
              />
              <p className="text-xs text-gray-500">
                推奨: 横長の画像（16:9）、最大10MB
              </p>
            </div>

            {/* グループ名 */}
            <div className="space-y-2">
              <Label htmlFor="group-name">グループ名</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="グループの名前"
                maxLength={100}
              />
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="group-description">説明（任意）</Label>
              <Textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="グループの説明"
                rows={3}
              />
            </div>

            {/* 公開設定 */}
            <div className="space-y-2">
              <Label>公開設定</Label>
              <Select
                value={visibilityType}
                onValueChange={(value: 'public' | 'private') => {
                  setVisibilityType(value)
                  // プライベートの場合は自動的に招待制に
                  if (value === 'private') {
                    setJoinType('approval')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">パブリック</SelectItem>
                  <SelectItem value="private">プライベート</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {visibilityType === 'public'
                  ? '誰でもグループを検索・閲覧できます'
                  : 'メンバーのみがグループを閲覧できます'}
              </p>
            </div>

            {/* 参加方法 */}
            <div className="space-y-2">
              <Label>参加方法</Label>
              <Select
                value={joinType}
                onValueChange={(v) => setJoinType(v as 'free' | 'approval')}
                disabled={visibilityType === 'private'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityType === 'private' ? (
                    <SelectItem value="approval">承認制</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="free">自由参加</SelectItem>
                      <SelectItem value="approval">承認制</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {joinType === 'free'
                  ? '誰でも自由に参加できます'
                  : '参加には承認が必要です'}
              </p>
              {visibilityType === 'private' && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  📝 プライベートグループは承認制のみ可能です
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || createGroup.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createGroup.isPending ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
