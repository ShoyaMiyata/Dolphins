'use client'
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Home as HomeIcon, LogOut, ExternalLink, MessageSquare, Users, Plus, ChevronDown, ChevronRight, Globe, Lock, RotateCcw, Shield } from 'lucide-react'
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
import { Image as ImageIcon } from 'lucide-react'

interface AppHeaderProps {
  groupName?: string
}

export function AppHeader({ groupName }: AppHeaderProps = {}) {
  const [open, setOpen] = useState(false)
  const [groupsExpanded, setGroupsExpanded] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null)
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

  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setGroupImage(file)
    const preview = URL.createObjectURL(file)
    setGroupImagePreview(preview)
  }

  // 画像削除処理
  const handleImageRemove = () => {
    if (groupImagePreview) {
      URL.revokeObjectURL(groupImagePreview)
    }
    setGroupImage(null)
    setGroupImagePreview(null)
  }

  // グループ作成処理
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    await createGroup.mutateAsync({
      name: newGroupName,
      description: groupDescription || undefined,
      image: groupImage || undefined,
      joinType,
      visibilityType,
    })

    // フォームをリセット
    setIsCreateDialogOpen(false)
    setNewGroupName('')
    setGroupDescription('')
    handleImageRemove()
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

          {/* Logo or Group Name */}
          <div className="flex-1 flex items-center justify-center">
            {groupName ? (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">{groupName}</h1>
              </div>
            ) : (
              <Image
                src="/images/logo-text.png"
                alt="Dolphins B.B.C."
                width={160}
                height={50}
                className="h-12 w-auto object-contain logo-blue-filter"
                priority
              />
            )}
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
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>グループを作成</DialogTitle>
            <DialogDescription>
              新しいグループを作成して、メンバーと交流しましょう
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* グループ画像 */}
            <div className="space-y-2">
              <Label>グループ画像</Label>
              {groupImagePreview ? (
                <div className="relative w-32 h-32">
                  <img
                    src={groupImagePreview}
                    alt="プレビュー"
                    className="w-full h-full rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1 block">
                      画像を選択
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

            {/* グループ名 */}
            <div className="space-y-2">
              <Label htmlFor="group-name">グループ名</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="グループの名前を入力"
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
                placeholder="グループの説明を入力"
                rows={3}
              />
            </div>

            {/* 参加方法 */}
            <div className="space-y-2">
              <Label>参加方法</Label>
              <Select value={joinType} onValueChange={(v) => setJoinType(v as 'free' | 'approval')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">自由参加</SelectItem>
                  <SelectItem value="approval">承認制</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {joinType === 'free'
                  ? '誰でも自由に参加できます'
                  : '参加にはオーナーの承認が必要です'}
              </p>
            </div>

            {/* 公開設定 */}
            <div className="space-y-2">
              <Label>公開設定</Label>
              <Select value={visibilityType} onValueChange={(v) => setVisibilityType(v as 'public' | 'private')}>
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
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || createGroup.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createGroup.isPending ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
