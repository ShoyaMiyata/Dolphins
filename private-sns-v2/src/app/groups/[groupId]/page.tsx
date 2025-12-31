'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useGroup, useJoinGroup, useLeaveGroup, useDeleteGroup } from '@/hooks/use-groups'
import { useGroupPosts, useCreateGroupPost, useDeleteGroupPost } from '@/hooks/use-group-posts'
import { useAuthStore } from '@/stores/auth-store'
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
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Users,
  Lock,
  Globe,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  Trash2,
  Settings,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string
  const user = useAuthStore((state) => state.user)

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId)
  const { data: posts, isLoading: isPostsLoading } = useGroupPosts(groupId)
  const createPost = useCreateGroupPost()
  const deletePost = useDeleteGroupPost()
  const joinGroup = useJoinGroup()
  const leaveGroup = useLeaveGroup()
  const deleteGroup = useDeleteGroup()

  // 投稿フォーム
  const [postContent, setPostContent] = useState('')
  const [postImages, setPostImages] = useState<File[]>([])
  const [postImagePreviews, setPostImagePreviews] = useState<string[]>([])

  // 削除ダイアログ
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false)

  // 画像ビューア
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({})

  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 4 - postImages.length)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

    setPostImages([...postImages, ...newFiles])
    setPostImagePreviews([...postImagePreviews, ...newPreviews])
  }

  // 画像削除処理
  const handleImageRemove = (index: number) => {
    URL.revokeObjectURL(postImagePreviews[index])
    setPostImages(postImages.filter((_, i) => i !== index))
    setPostImagePreviews(postImagePreviews.filter((_, i) => i !== index))
  }

  // 投稿作成処理
  const handleCreatePost = async () => {
    if (!postContent.trim() && postImages.length === 0) return

    await createPost.mutateAsync({
      groupId,
      content: postContent,
      images: postImages.length > 0 ? postImages : undefined,
    })

    // フォームをリセット
    setPostContent('')
    postImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setPostImages([])
    setPostImagePreviews([])
  }

  // 投稿削除処理
  const handleDeletePost = async () => {
    if (!deletingPostId) return

    await deletePost.mutateAsync({
      postId: deletingPostId,
      groupId,
    })

    setIsDeletePostDialogOpen(false)
    setDeletingPostId(null)
  }

  // グループ参加処理
  const handleJoinGroup = async () => {
    await joinGroup.mutateAsync(groupId)
  }

  // グループ退出処理
  const handleLeaveGroup = async () => {
    await leaveGroup.mutateAsync(groupId)
  }

  // グループ削除処理
  const handleDeleteGroup = async () => {
    await deleteGroup.mutateAsync(groupId)
    router.push('/groups')
  }

  if (isGroupLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="text-center text-red-500 py-8">グループが見つかりませんでした</div>
        </div>
      </div>
    )
  }

  const isMember = group.is_member
  const isOwner = group.is_owner

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsDeleteGroupDialogOpen(true)}
                  className="text-red-600 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  グループを削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* グループ情報 */}
        <Card className="bg-white rounded-xl shadow-sm border border-blue-100 mb-4">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* グループ画像 */}
              <div className="flex-shrink-0">
                {group.image_url ? (
                  <img
                    src={group.image_url}
                    alt={group.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                {/* グループ名とアイコン */}
                <div className="flex items-start gap-2 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
                  {group.visibility_type === 'private' ? (
                    <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <Globe className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>

                {/* 説明 */}
                {group.description && (
                  <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                    {group.description}
                  </p>
                )}

                {/* メタ情報 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.member_count}人
                  </span>
                  <span>
                    {group.join_type === 'free' ? '自由参加' : '承認制'}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(group.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </div>

                {/* アクションボタン */}
                {!isOwner && (
                  <div>
                    {isMember ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeaveGroup}
                        disabled={leaveGroup.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {leaveGroup.isPending ? '退出中...' : 'グループを退出'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleJoinGroup}
                        disabled={joinGroup.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {joinGroup.isPending ? '参加中...' : 'グループに参加'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 投稿フォーム（メンバーのみ） */}
        {isMember && (
          <Card className="bg-white rounded-xl shadow-sm border border-blue-100 mb-4">
            <CardContent className="p-4">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="投稿を作成..."
                className="min-h-[100px] mb-3 resize-none border-gray-200"
              />

              {/* 画像プレビュー */}
              {postImagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {postImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`プレビュー ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => handleImageRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={postImages.length >= 4}
                  />
                  <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      画像を追加 ({postImages.length}/4)
                    </span>
                  </div>
                </label>

                <Button
                  onClick={handleCreatePost}
                  disabled={(!postContent.trim() && postImages.length === 0) || createPost.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createPost.isPending ? '投稿中...' : '投稿'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 投稿一覧 */}
        {isPostsLoading ? (
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>まだ投稿がありません</p>
            {isMember && <p className="text-sm mt-2">最初の投稿を作成しましょう</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isPostOwner = user?.id === post.user_id

              return (
                <Card key={post.id} className="bg-white rounded-xl shadow-sm border border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      {/* アバター */}
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={post.profiles.avatar_url || undefined} />
                        <AvatarFallback>
                          {post.profiles.display_name?.[0] || post.profiles.username[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-3">
                        {/* ヘッダー */}
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="font-semibold text-base">
                              {post.profiles.display_name || post.profiles.username}
                            </span>
                            <span className="text-sm text-gray-500">
                              @{post.profiles.username} ·{' '}
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: ja,
                              })}
                            </span>
                          </div>

                          {/* オプションメニュー（投稿者のみ） */}
                          {isPostOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingPostId(post.id)
                                setIsDeletePostDialogOpen(true)
                              }}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* 投稿内容 */}
                        {post.content && (
                          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                            {post.content}
                          </p>
                        )}

                        {/* 画像ギャラリー */}
                        {post.group_post_images.length > 0 && (
                          <div
                            className={`grid gap-2 ${
                              post.group_post_images.length === 1
                                ? 'grid-cols-1'
                                : post.group_post_images.length === 2
                                  ? 'grid-cols-2'
                                  : post.group_post_images.length === 3
                                    ? 'grid-cols-3'
                                    : 'grid-cols-2'
                            }`}
                          >
                            {post.group_post_images.slice(0, 4).map((image, index) => (
                              <div
                                key={image.id}
                                className={`relative overflow-hidden rounded-lg border cursor-pointer ${
                                  post.group_post_images.length === 3 && index === 0
                                    ? 'col-span-3'
                                    : ''
                                }`}
                                onClick={() => setSelectedImage(image.image_url)}
                              >
                                {!imageLoaded[image.id] && (
                                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                )}
                                <img
                                  src={image.image_url}
                                  alt={`投稿画像 ${index + 1}`}
                                  className={`w-full object-cover transition-opacity duration-300 ${
                                    post.group_post_images.length === 1
                                      ? 'max-h-[500px]'
                                      : 'aspect-square'
                                  } ${imageLoaded[image.id] ? 'opacity-100' : 'opacity-0'}`}
                                  onLoad={() =>
                                    setImageLoaded((prev) => ({ ...prev, [image.id]: true }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 投稿削除ダイアログ */}
      <Dialog open={isDeletePostDialogOpen} onOpenChange={setIsDeletePostDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>投稿を削除しますか?</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。投稿と関連する画像が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeletePostDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* グループ削除ダイアログ */}
      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>グループを削除しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。グループと全ての投稿が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteGroupDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 画像ビューア */}
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
