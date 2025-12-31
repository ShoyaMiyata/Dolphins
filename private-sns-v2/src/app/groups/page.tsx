'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroups, useCreateGroup } from '@/hooks/use-groups'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Users, Lock, Globe, Image as ImageIcon, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function GroupsPage() {
  const router = useRouter()
  const { data: groups, isLoading } = useGroups()
  const createGroup = useCreateGroup()

  // グループ作成ダイアログ
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupImage, setGroupImage] = useState<File | null>(null)
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null)
  const [joinType, setJoinType] = useState<'free' | 'approval'>('free')
  const [visibilityType, setVisibilityType] = useState<'public' | 'private'>('public')

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
    if (!groupName.trim()) return

    await createGroup.mutateAsync({
      name: groupName,
      description: groupDescription || undefined,
      image: groupImage || undefined,
      joinType,
      visibilityType,
    })

    // フォームをリセット
    setIsCreateDialogOpen(false)
    setGroupName('')
    setGroupDescription('')
    handleImageRemove()
    setJoinType('free')
    setVisibilityType('public')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">グループ</h1>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            グループ作成
          </Button>
        </div>

        {/* グループ一覧 */}
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        ) : !groups || groups.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>まだグループがありません</p>
            <p className="text-sm mt-2">新しいグループを作成しましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="bg-white rounded-xl shadow-sm border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* グループ画像 */}
                    <div className="flex-shrink-0">
                      {group.image_url ? (
                        <img
                          src={group.image_url}
                          alt={group.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* グループ名とアイコン */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          {group.visibility_type === 'private' ? (
                            <Lock className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* 説明 */}
                      {group.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {group.description}
                        </p>
                      )}

                      {/* メタ情報 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.member_count}人
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(group.created_at), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                        {group.is_member && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                            参加中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
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
              disabled={!groupName.trim() || createGroup.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createGroup.isPending ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
