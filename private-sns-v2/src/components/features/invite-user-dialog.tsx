'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSearchUsersForInvite, useInviteUserToGroup } from '@/hooks/use-group-members'
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
  const [searchResults, setSearchResults] = useState<any[]>([])

  const searchUsers = useSearchUsersForInvite()
  const inviteUser = useInviteUserToGroup()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.trim()) {
      try {
        const result = await searchUsers.mutateAsync({ query, groupId })
        setSearchResults(result)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
        toast.error('ユーザーの検索に失敗しました')
      }
    } else {
      setSearchResults([])
    }
  }

  const handleInvite = async (userId: string, userName: string) => {
    try {
      await inviteUser.mutateAsync(
        { groupId, userId },
        {
          onSuccess: () => {
            setSearchQuery('')
            setSearchResults([])
            onOpenChange(false)
            toast.success(`${userName}さんを${groupName}に招待しました`)
          }
        }
      )
    } catch (error) {
      // エラーはフック側で処理されるので、ここでは何もしない
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ユーザーを招待
            <span className="text-sm font-normal text-gray-500">
              - {groupName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Input
              placeholder="ユーザー名または表示名で検索..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              既にグループメンバーのユーザーは表示されません
            </p>
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery.trim() && !searchUsers.isPending && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  ユーザーが見つかりません
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  別のキーワードで検索してみてください
                </p>
              </div>
            )}

            {searchUsers.isPending && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">検索中...</p>
              </div>
            )}

            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {user.display_name || user.username}
                    </p>
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

                <Button
                  size="sm"
                  onClick={() => handleInvite(user.id, user.display_name || user.username)}
                  disabled={inviteUser.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-3"
                >
                  {inviteUser.isPending ? '招待中...' : '招待'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
