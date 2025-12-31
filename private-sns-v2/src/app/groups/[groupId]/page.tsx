'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useGroup } from '@/hooks/use-groups'
import { useGroupPosts } from '@/hooks/use-group-posts'
import { useGroupMembers, useApproveJoinRequest, useRejectJoinRequest, useUpdateMemberRole, useRemoveGroupMember, useJoinGroup, useLeaveGroup } from '@/hooks/use-group-members'
import { useGroupJoinRequests } from '@/hooks/use-group-members'
import { useUser } from '@/hooks/use-user'
import { AppHeader } from '@/components/layout/app-header'
import { PostForm } from '@/components/features/post-form'
import { PostCard } from '@/components/features/post-card'
import { PostSkeleton } from '@/components/features/post-skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { motion } from 'framer-motion'

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.groupId as string

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId)
  const { data: posts, isLoading: isPostsLoading } = useGroupPosts(groupId)
  const { data: members } = useGroupMembers(groupId)
  const { data: joinRequests } = useGroupJoinRequests(groupId)
  const { data: currentUser } = useUser()

  const joinGroup = useJoinGroup()
  const leaveGroup = useLeaveGroup()
  const approveJoinRequest = useApproveJoinRequest()
  const rejectJoinRequest = useRejectJoinRequest()
  const updateMemberRole = useUpdateMemberRole()
  const removeMember = useRemoveGroupMember()

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('posts')

  // 現在のユーザーの役割を取得
  const currentUserRole = members?.find(member => member.user_id === currentUser?.user?.id)?.role || null
  const isOwner = currentUserRole === 'owner'
  const isAdmin = currentUserRole === 'admin'
  const canManageMembers = isOwner || isAdmin

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

  const isMember = group.is_member

  return (
    <div className="bg-background">
      {/* Custom Header for Group */}
      <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button variant="ghost" size="icon" className="text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            {/* Group Name */}
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
            </div>

            {/* Join/Leave Button */}
            {currentUser?.user && (
              <Button
                variant={isMember ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  if (isMember) {
                    leaveGroup.mutate(groupId)
                  } else {
                    joinGroup.mutate({ groupId, joinType: group.join_type })
                  }
                }}
                disabled={joinGroup.isPending || leaveGroup.isPending}
                className={isMember ? "border-red-200 text-red-600 hover:bg-red-50" : ""}
              >
                {joinGroup.isPending ? (
                  "参加中..."
                ) : leaveGroup.isPending ? (
                  "退会中..."
                ) : isMember ? (
                  <>
                    <LogOut className="h-4 w-4 mr-1" />
                    退会
                  </>
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
            <div className="space-y-4">
              {/* Join Requests (for owners/admins) */}
              {canManageMembers && joinRequests && joinRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      参加リクエスト ({joinRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.profiles.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.profiles.display_name || request.profiles.username}</p>
                            <p className="text-sm text-gray-500">@{request.profiles.username}</p>
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
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectJoinRequest.mutate({
                              requestId: request.id,
                              groupId: request.group_id
                            })}
                            disabled={rejectJoinRequest.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    メンバー ({members?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members?.map((member) => {
                      const isCurrentUser = member.user_id === currentUser?.user?.id
                      const canManageThisMember = canManageMembers && !isCurrentUser && member.role !== 'owner'

                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profiles.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.profiles.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {member.profiles.display_name || member.profiles.username}
                                </p>
                                {member.role === 'owner' && (
                                  <Badge variant="default" className="bg-yellow-500">
                                    <Crown className="h-3 w-3 mr-1" />
                                    オーナー
                                  </Badge>
                                )}
                                {member.role === 'admin' && (
                                  <Badge variant="secondary">
                                    <Shield className="h-3 w-3 mr-1" />
                                    管理者
                                  </Badge>
                                )}
                                {member.role === 'member' && (
                                  <Badge variant="outline">
                                    <User className="h-3 w-3 mr-1" />
                                    メンバー
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">@{member.profiles.username}</p>
                            </div>
                          </div>

                          {/* Member management menu */}
                          {canManageThisMember && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.role !== 'admin' && (
                                  <DropdownMenuItem
                                    onClick={() => updateMemberRole.mutate({
                                      groupId: member.group_id,
                                      userId: member.user_id,
                                      role: 'admin'
                                    })}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    管理者にする
                                  </DropdownMenuItem>
                                )}
                                {member.role === 'admin' && (
                                  <DropdownMenuItem
                                    onClick={() => updateMemberRole.mutate({
                                      groupId: member.group_id,
                                      userId: member.user_id,
                                      role: 'member'
                                    })}
                                  >
                                    <User className="h-4 w-4 mr-2" />
                                    メンバーに戻す
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => removeMember.mutate({
                                    groupId: member.group_id,
                                    userId: member.user_id
                                  })}
                                  className="text-red-600"
                                >
                                  グループから除外
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </div>
  )
}
