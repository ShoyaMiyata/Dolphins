'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGroup, useUpdateGroup, useDeleteGroup } from '@/hooks/use-groups'
import { useGroupPosts } from '@/hooks/use-group-posts'
import { useGroupMembers, useApproveJoinRequest, useRejectJoinRequest, useUpdateMemberRole, useRemoveGroupMember, useJoinGroup, useLeaveGroup, useInviteUserToGroup, useSearchUsersForInvite } from '@/hooks/use-group-members'
import { useGroupJoinRequests } from '@/hooks/use-group-members'
import { useUser } from '@/hooks/use-user'
import { AppHeader } from '@/components/layout/app-header'
import { PostForm } from '@/components/features/post-form'
import PostCard from '@/components/features/post-card'
import { PostSkeleton } from '@/components/features/post-skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
import { Users, UserPlus, Settings, Crown, Shield, User, Check, X, MoreVertical, LogIn, LogOut, MessageSquare, Loader2, Trash2, AlertTriangle, ChevronLeft } from 'lucide-react'
import { InviteUserDialog } from '@/components/features/invite-user-dialog'
import { motion, AnimatePresence } from 'framer-motion'

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
  const deleteGroup = useDeleteGroup()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string; userId: string; groupId: string } | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    visibility_type: 'public' as 'public' | 'private',
    join_type: 'free' as 'free' | 'approval'
  })
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [coverImageToDelete, setCoverImageToDelete] = useState(false)
  const [iconImageFile, setIconImageFile] = useState<File | null>(null)
  const [iconImagePreview, setIconImagePreview] = useState<string | null>(null)
  const [iconImageToDelete, setIconImageToDelete] = useState(false)
  const coverImageInputRef = useState<HTMLInputElement | null>(null)[0]

  // 現在のユーザーの役割を取得
  const currentUserRole = members?.find(member => member.user_id === currentUser?.id)?.role || null
  const isOwner = currentUserRole === 'owner'
  const isAdmin = currentUserRole === 'admin'
  const isMember = group?.is_member || false
  // メンバーは誰でも参加リクエストを管理可能
  const canManageMembers = isMember

  // 現在のユーザーがこのグループに申請中かどうかチェック
  const hasPendingRequest = joinRequests?.some(request => request.user_id === currentUser?.id) || false

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
    <div className="bg-gradient-to-br from-blue-50 via-white to-sky-50 min-h-screen">
      {/* Use AppHeader with group name */}
      <AppHeader groupName={group.name} icon={Users} />

      {/* Main Content */}
      <main className="container max-w-md mx-auto pb-32 px-0 sm:px-4">
        {/* グループヘッダーセクション */}
        <div className="relative mb-4">
          {/* カバー画像 */}
          <div className="h-32 sm:h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600 overflow-hidden relative">
            {group.cover_image_url && (
              <img
                src={group.cover_image_url}
                alt="カバー画像"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* グループ情報カード */}
          <div className="px-4">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 -mt-8 relative z-10">
              <div className="flex items-start gap-3">
                {/* グループアイコン */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl flex-shrink-0 shadow-md border-2 border-white">
                  {group.image_url ? (
                    <img src={group.image_url} alt={group.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Users className="w-8 h-8 sm:w-10 sm:h-10" />
                  )}
                </div>

                {/* グループ名と説明 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-blue-900 truncate">{group.name}</h2>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-blue-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{members?.length || 0}人</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs px-2 py-0 border-blue-200 text-blue-600">
                          {group.visibility_type === 'public' ? 'パブリック' : 'プライベート'}
                        </Badge>
                      </div>
                    </div>
                    {isMember && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSettingsForm({
                              name: group.name,
                              description: group.description || '',
                              visibility_type: group.visibility_type,
                              join_type: group.join_type,
                            })
                            setCoverImagePreview(group.cover_image_url || null)
                            setCoverImageFile(null)
                            setCoverImageToDelete(false)
                            setIconImagePreview(group.image_url || null)
                            setIconImageFile(null)
                            setIconImageToDelete(false)
                            setSettingsDialogOpen(true)
                          }}
                          className="text-xs h-8 px-4 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 text-blue-700 border border-blue-200 hover:border-blue-300 rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                          <div className="p-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                            <Settings className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium">設定</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 px-4 sm:px-0">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-50 to-sky-50 p-1 rounded-xl">
            <TabsTrigger value="posts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <MessageSquare className="h-4 w-4" />
              投稿
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <Users className="h-4 w-4" />
              メンバー ({members?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {/* Post Form (Members Only) */}
            {isMember && (
              <div className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow">
                <PostForm groupId={groupId} />
              </div>
            )}

            {/* Non-member message */}
            {!isMember && (
              <Card className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 p-6 text-center">
                <p className="text-gray-600">このグループのメンバーになると投稿できます</p>
              </Card>
            )}

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
                        type: null,
                        original_post_id: null,
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
                      groupId={groupId}
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <UserPlus className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-900">参加リクエスト</h3>
                        <p className="text-sm text-orange-700">{joinRequests.length}件の申請があります</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {joinRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg p-3 border border-orange-100 shadow-sm"
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 ring-1 ring-orange-100 flex-shrink-0">
                              <AvatarImage src={request.profiles.avatar_url || undefined} />
                              <AvatarFallback className="bg-orange-100 text-orange-700 font-medium text-xs">
                                {request.profiles.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm">
                                {request.profiles.display_name || request.profiles.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">@{request.profiles.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => approveJoinRequest.mutate({
                                requestId: request.id,
                                groupId: request.group_id,
                                userId: request.user_id
                              })}
                              disabled={approveJoinRequest.isPending}
                              className="w-6 h-6 p-0 bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectJoinRequest.mutate({
                                requestId: request.id,
                                groupId: request.group_id
                              })}
                              disabled={rejectJoinRequest.isPending}
                              className="w-6 h-6 p-0 border-red-200 text-red-600 hover:bg-red-50 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Members List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">メンバー一覧</h3>
                      <p className="text-sm text-gray-500">{members?.length || 0}人のメンバー</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {members?.map((member, index) => {
                      const isCurrentUser = member.user_id === currentUser?.id
                      const canManageThisMember = canManageMembers && !isCurrentUser && member.role !== 'owner'
                      const joinedDate = new Date(member.joined_at).toLocaleDateString('ja-JP')

                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-12 w-12 ring-2 ring-blue-50 group-hover:ring-blue-100 transition-colors">
                                <AvatarImage src={member.profiles.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                                  {member.profiles.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {isCurrentUser && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {/* Role indicator */}
                              {member.role === 'owner' && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                                  <Crown className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {member.role === 'admin' && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                                  <Shield className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <p className="font-semibold text-gray-900 truncate max-w-[120px] text-sm">
                                  {member.profiles.display_name || member.profiles.username}
                                </p>
                                {isCurrentUser && (
                                  <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs px-2 py-0">
                                    あなた
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-2 truncate">@{member.profiles.username}</p>
                              <p className="text-xs text-gray-400 mb-3">
                                {joinedDate}参加
                              </p>

                              {/* Management Actions */}
                              {canManageThisMember && (
                                <div className="space-y-3">
                                  {/* Remove Member Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log('Remove member clicked for:', member.user_id, member.profiles.display_name || member.profiles.username)
                                      setMemberToRemove({
                                        id: member.id,
                                        name: member.profiles.display_name || member.profiles.username,
                                        userId: member.user_id,
                                        groupId: member.group_id
                                      })
                                      setRemoveMemberDialogOpen(true)
                                    }}
                                    disabled={removeMember.isPending}
                                    className="w-full text-xs h-8 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200 hover:shadow-sm"
                                  >
                                    {removeMember.isPending ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>除外中...</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2">
                                        <Trash2 className="h-3 w-3" />
                                        <span>メンバーを除外</span>
                                      </div>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
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
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>グループ設定</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            {/* アイコン画像 */}
            <div className="space-y-2">
              <Label>グループアイコン</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl overflow-hidden border-2 border-blue-200 flex-shrink-0">
                  {iconImagePreview ? (
                    <img
                      src={iconImagePreview}
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
                    onClick={() => document.getElementById('group-icon-image-input')?.click()}
                    className="text-sm"
                  >
                    アイコンを変更
                  </Button>
                  {(iconImagePreview || group.image_url) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIconImagePreview(null)
                        setIconImageFile(null)
                        setIconImageToDelete(true)
                      }}
                      className="text-sm text-red-600"
                    >
                      削除
                    </Button>
                  )}
                </div>
              </div>
              <input
                id="group-icon-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    alert('ファイルサイズは5MB以下にしてください')
                    return
                  }
                  setIconImageFile(file)
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setIconImagePreview(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <p className="text-xs text-gray-500">
                推奨: 正方形の画像、最大5MB
              </p>
            </div>

            {/* カバー画像 */}
            <div className="space-y-2">
              <Label>カバー画像</Label>
              <div className="relative w-full h-32 bg-gradient-to-r from-blue-100 to-sky-100 rounded-xl overflow-hidden border-2 border-blue-200">
                {coverImagePreview ? (
                  <img
                    src={coverImagePreview}
                    alt="カバー画像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-400">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('group-cover-image-input')?.click()}
                  className="text-sm"
                >
                  カバー画像を変更
                </Button>
                {(coverImagePreview || group.cover_image_url) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverImagePreview(null)
                      setCoverImageFile(null)
                      setCoverImageToDelete(true)
                    }}
                    className="text-sm text-red-600"
                  >
                    削除
                  </Button>
                )}
              </div>
              <input
                id="group-cover-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setCoverImageFile(file)
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setCoverImagePreview(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <p className="text-xs text-gray-500">
                推奨: 横長の画像（16:9）、最大10MB
              </p>
            </div>

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

          {/* Delete Group Button (Owner Only) */}
          {isOwner && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteGroupDialogOpen(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                グループを削除
              </Button>
              <p className="text-xs text-red-500 mt-2 text-center">
                この操作は取り消すことができません
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
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

                // 画像処理
                if (coverImageToDelete) updates.coverImage = null
                else if (coverImageFile) updates.coverImage = coverImageFile

                if (iconImageToDelete) updates.image = null
                else if (iconImageFile) updates.image = iconImageFile

                const hasChanges = Object.keys(updates).length > 0 || coverImageToDelete || iconImageToDelete

                if (hasChanges) {
                  updateGroup.mutate(
                    { groupId, ...updates },
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

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              メンバーを除外
            </DialogTitle>
            <DialogDescription className="text-left">
              <span className="font-medium text-gray-900">{memberToRemove?.name}</span> をこのグループから除外しますか？
              <br />
              この操作は取り消すことができません。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setRemoveMemberDialogOpen(false)
                setMemberToRemove(null)
              }}
              className="flex-1 sm:flex-none"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (memberToRemove) {
                  removeMember.mutate(
                    {
                      groupId: memberToRemove.groupId,
                      userId: memberToRemove.userId
                    },
                    {
                      onSuccess: () => {
                        setRemoveMemberDialogOpen(false)
                        setMemberToRemove(null)
                      }
                    }
                  )
                }
              }}
              disabled={removeMember.isPending}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              {removeMember.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>除外中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>除外する</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              グループを削除
            </DialogTitle>
            <DialogDescription className="text-left">
              <span className="font-medium text-gray-900">{group.name}</span> を削除しますか？
              <br />
              この操作は取り消すことができません。
              <br />
              すべての投稿、メンバー情報、関連データが削除されます。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteGroupDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteGroup.mutate(groupId, {
                  onSuccess: () => {
                    setDeleteGroupDialogOpen(false)
                    // グループ削除後にホーム画面に遷移
                    router.push('/home')
                  }
                })
              }}
              disabled={deleteGroup.isPending}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              {deleteGroup.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>削除中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>削除する</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
