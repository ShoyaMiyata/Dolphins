'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGroup } from '@/hooks/use-groups'
import { useGroupPosts } from '@/hooks/use-group-posts'
import { useGroupMembers, useApproveJoinRequest, useRejectJoinRequest, useUpdateMemberRole, useRemoveGroupMember, useJoinGroup, useLeaveGroup, useInviteUserToGroup, useSearchUsersForInvite, useUpdateGroup } from '@/hooks/use-group-members'
import { useGroupJoinRequests } from '@/hooks/use-group-members'
import { useUser } from '@/hooks/use-user'
import { AppHeader } from '@/components/layout/app-header'
import { PostForm } from '@/components/features/post-form'
import { PostCard } from '@/components/features/post-card'
import { PostSkeleton } from '@/components/features/post-skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Settings, Crown, Shield, User, Check, X, MoreVertical, LogIn, LogOut } from 'lucide-react'
import { InviteUserDialog } from '@/components/features/invite-user-dialog'
import { motion } from 'framer-motion'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId)
  const { data: posts, isLoading: isPostsLoading } = useGroupPosts(groupId)
  const { data: members } = useGroupMembers(groupId)
  const { data: joinRequests } = useGroupJoinRequests(groupId)
  const { user: currentUser } = useUser()

  const joinGroup = useJoinGroup()
  const leaveGroup = useLeaveGroup()
  const approveJoinRequest = useApproveJoinRequest()
  const rejectJoinRequest = useRejectJoinRequest()
  const updateMemberRole = useUpdateMemberRole()
  const removeMember = useRemoveGroupMember()
  const inviteUser = useInviteUserToGroup()
  const searchUsers = useSearchUsersForInvite()
  const updateGroup = useUpdateGroup()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    visibility_type: 'public' as 'public' | 'private',
    join_type: 'free' as 'free' | 'approval'
  })

  // 現在のユーザーの役割を取得
  const currentUserRole = members?.find(member => member.user_id === currentUser?.id)?.role || null
  const isOwner = currentUserRole === 'owner'
  const isAdmin = currentUserRole === 'admin'
  const isMember = group?.is_member || false
  // 全メンバーがメンバー管理可能（オーナーのみ除外）
  const canManageMembers = isMember && currentUserRole !== 'owner'

  if (isGroupLoading) {
    return (
      <div className="bg-background">
        <AppHeader />
        <main className="container max-w-md mx-auto pb-32 px-4">
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        </main>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="bg-background">
        <AppHeader />
        <main className="container max-w-md mx-auto pb-32 px-4">
          <div className="text-center text-red-500 py-8">グループが見つかりませんでした</div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Custom Header for Group */}
      <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-600"
              onClick={() => router.push('/home')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            {/* Group Name */}
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
            </div>

            {/* Settings Menu */}
            {isMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsForm({
                        name: group.name,
                        description: group.description || '',
                        visibility_type: group.visibility_type,
                        join_type: group.join_type,
                      })
                      setSettingsDialogOpen(true)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    グループ設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => leaveGroup.mutate(groupId)}
                    disabled={leaveGroup.isPending}
                    className="text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {leaveGroup.isPending ? '退会中...' : 'グループから退会'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Join Button (Non-member) */}
            {!isMember && currentUser && (
              <Button
                variant="default"
                size="sm"
                onClick={() => joinGroup.mutate({ groupId, joinType: group.join_type })}
                disabled={joinGroup.isPending}
              >
                {joinGroup.isPending ? (
                  "参加中..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-1" />
                    {group.join_type === 'free' ? '参加' : 'リクエスト'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-md mx-auto pb-32 px-4">
        {/* Post Form (Members Only) */}
        {isMember && activeTab === 'posts' && (
          <div className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 mt-4 hover:shadow-lg transition-shadow">
            <PostForm groupId={groupId} />
          </div>
        )}

        {/* Non-member message */}
        {!isMember && activeTab === 'posts' && (
          <Card className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 mt-4 p-6 text-center">
            <p className="text-gray-600">このグループのメンバーになると投稿できます</p>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              投稿
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              メンバー ({members?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {/* Timeline */}
            {isPostsLoading ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : !posts || posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-500 py-12"
              >
                <p>まだ投稿がありません</p>
                {isMember && <p className="text-sm mt-2">最初の投稿を作成しましょう</p>}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <PostCard
                      post={{
                        id: post.id,
                        user_id: post.user_id,
                        content: post.content,
                        created_at: post.created_at,
                        updated_at: post.updated_at,
                        profiles: post.profiles,
                        post_images: post.group_post_images.map((img: any) => ({
                          id: img.id,
                          image_url: img.image_url,
                          order_index: img.order_index,
                          post_id: post.id,
                          created_at: img.created_at,
                        })),
                        likes_count: 0,
                        comments_count: 0,
                        reposts_count: 0,
                        is_liked: false,
                        is_reposted: false,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <div className="space-y-6">
              {/* Header with Invite Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    メンバー管理
                  </h3>
                  <Badge variant="secondary" className="text-sm">
                    {members?.length || 0}人
                  </Badge>
                </div>
                {canManageMembers && (
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    メンバーを招待
                  </Button>
                )}
              </div>

              {/* Join Requests Section */}
              {canManageMembers && joinRequests && joinRequests.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <UserPlus className="h-5 w-5" />
                      参加リクエスト
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        {joinRequests.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.profiles.avatar_url || undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {request.profiles.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.profiles.display_name || request.profiles.username}
                            </p>
                            <p className="text-sm text-gray-500">@{request.profiles.username}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(request.created_at).toLocaleDateString('ja-JP')} に申請
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveJoinRequest.mutate({
                              requestId: request.id,
                              groupId: request.group_id,
                              userId: request.user_id
                            })}
                            disabled={approveJoinRequest.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectJoinRequest.mutate({
                              requestId: request.id,
                              groupId: request.group_id
                            })}
                            disabled={rejectJoinRequest.isPending}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            拒否
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Members List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    メンバー一覧
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members?.map((member) => {
                      const isCurrentUser = member.user_id === currentUser?.id
                      const canManageThisMember = canManageMembers && !isCurrentUser && member.role !== 'owner'
                      const joinedDate = new Date(member.joined_at).toLocaleDateString('ja-JP')

                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profiles.avatar_url || undefined} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                                  {member.profiles.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {isCurrentUser && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900 truncate">
                                  {member.profiles.display_name || member.profiles.username}
                                </p>
                                {member.role === 'owner' && (
                                  <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
                                    <Crown className="h-3 w-3 mr-1" />
                                    オーナー
                                  </Badge>
                                )}
                                {member.role === 'admin' && (
                                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0">
                                    <Shield className="h-3 w-3 mr-1" />
                                    管理者
                                  </Badge>
                                )}
                                {member.role === 'member' && (
                                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                                    <User className="h-3 w-3 mr-1" />
                                    メンバー
                                  </Badge>
                                )}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                                    あなた
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-1">@{member.profiles.username}</p>
                              <p className="text-xs text-gray-400">
                                {joinedDate} に参加
                              </p>
                              {member.profiles.bio && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1 max-w-md">
                                  {member.profiles.bio}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Management Actions */}
                          {canManageThisMember && (
                            <div className="flex gap-2">
                              {member.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMemberRole.mutate({
                                    groupId: member.group_id,
                                    userId: member.user_id,
                                    role: 'admin'
                                  })}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  管理者
                                </Button>
                              )}
                              {member.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMemberRole.mutate({
                                    groupId: member.group_id,
                                    userId: member.user_id,
                                    role: 'member'
                                  })}
                                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  メンバー
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeMember.mutate({
                                  groupId: member.group_id,
                                  userId: member.user_id
                                })}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <X className="h-3 w-3 mr-1" />
                                除外
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Image Viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-4xl p-0 bg-black">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="拡大表示"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog Component */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupId={groupId}
        groupName={group.name}
      />

      {/* Group Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>グループ設定</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-name">グループ名</Label>
              <Input
                id="group-name"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="グループの名前"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="group-description">説明（任意）</Label>
              <Textarea
                id="group-description"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="グループの説明"
                rows={3}
              />
            </div>

            {/* Visibility Type */}
            <div className="space-y-2">
              <Label>公開設定</Label>
              <Select
                value={settingsForm.visibility_type}
                onValueChange={(value: 'public' | 'private') =>
                  setSettingsForm(prev => ({ ...prev, visibility_type: value }))
                }
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
                {settingsForm.visibility_type === 'public'
                  ? '誰でもグループを検索・閲覧できます'
                  : 'メンバーのみがグループを閲覧できます'}
              </p>
            </div>

            {/* Join Type */}
            <div className="space-y-2">
              <Label>参加方法</Label>
              <Select
                value={settingsForm.join_type}
                onValueChange={(value: 'free' | 'approval') =>
                  setSettingsForm(prev => ({ ...prev, join_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">自由参加</SelectItem>
                  <SelectItem value="approval">承認制</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {settingsForm.join_type === 'free'
                  ? '誰でも自由に参加できます'
                  : '参加には承認が必要です'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setSettingsDialogOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={() => {
                // 変更されたフィールドのみを更新
                const updates: any = {}
                if (settingsForm.name !== group.name) updates.name = settingsForm.name
                if (settingsForm.description !== (group.description || '')) updates.description = settingsForm.description
                if (settingsForm.visibility_type !== group.visibility_type) updates.visibility_type = settingsForm.visibility_type
                if (settingsForm.join_type !== group.join_type) updates.join_type = settingsForm.join_type

                if (Object.keys(updates).length > 0) {
                  updateGroup.mutate(
                    { groupId, updates },
                    {
                      onSuccess: () => {
                        setSettingsDialogOpen(false)
                      }
                    }
                  )
                } else {
                  setSettingsDialogOpen(false)
                }
              }}
              disabled={updateGroup.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateGroup.isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
