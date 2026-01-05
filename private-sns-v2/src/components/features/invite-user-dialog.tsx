'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useGetAllUsersForInvite, useInviteUserToGroup } from '@/hooks/use-group-members'
import { toast } from 'sonner'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function InviteUserDialog({
  open,
  onOpenChange,
  groupId,
  groupName
}: InviteUserDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const { data: allUsers = [], isLoading } = useGetAllUsersForInvite(groupId) as { data: any[], isLoading: boolean }
  const inviteUser = useInviteUserToGroup()

  // ダイアログが開かれたら選択状態をリセット
  useEffect(() => {
    if (open) {
      setSelectedUsers(new Set())
      setSearchQuery('')
    }
  }, [open])

  // 検索フィルタリング
  const filteredUsers = allUsers.filter(user =>
    !searchQuery.trim() ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleUserSelect = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleInvite = async () => {
    if (selectedUsers.size === 0) {
      toast.error('招待するユーザーを選択してください')
      return
    }

    try {
      // 選択されたユーザーを順番に招待
      const invitePromises = Array.from(selectedUsers).map(userId =>
        inviteUser.mutateAsync({ groupId, userId })
      )

      await Promise.all(invitePromises)

      const selectedCount = selectedUsers.size
      setSelectedUsers(new Set())
      onOpenChange(false)
      toast.success(`${selectedCount}人のユーザーを${groupName}に招待しました`)
    } catch (error) {
      // エラーは個別の招待で処理されるので、ここでは何もしない
    }
  }

  const handleClose = () => {
    setSelectedUsers(new Set())
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl max-h-[calc(100vh-8rem)] sm:max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              ユーザーを招待
              <span className="text-sm font-normal text-gray-500">
                - {groupName}
              </span>
            </div>
            {selectedUsers.size > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedUsers.size}人選択中
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Search Input */}
          <div className="space-y-2">
            <Input
              placeholder="ユーザー名または表示名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Select All */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200/50">
              <Checkbox
                id="select-all"
                checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                onCheckedChange={handleSelectAll}
                className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium text-blue-900 cursor-pointer"
              >
                全て選択 ({filteredUsers.length}人)
              </label>
            </div>
          )}

          {/* Users List */}
          <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-2">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">読み込み中...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  {searchQuery.trim() ? '検索結果がありません' : '招待可能なユーザーがいません'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery.trim() ? '別のキーワードで検索してみてください' : '全てのユーザーが既にメンバーです'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                  />

                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`user-${user.id}`}
                      className="font-medium text-gray-900 cursor-pointer block truncate"
                    >
                      {user.display_name || user.username}
                    </label>
                    <p className="text-sm text-gray-500 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t flex-shrink-0 bg-white">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleInvite}
            disabled={selectedUsers.size === 0 || inviteUser.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {inviteUser.isPending ? '招待中...' : `招待 (${selectedUsers.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
