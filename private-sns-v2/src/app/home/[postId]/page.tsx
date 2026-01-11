'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { motion } from 'framer-motion'
import EmojiPicker from 'emoji-picker-react'
import {
  useCustomStamps,
  useCreateCustomStamp,
} from '@/hooks/use-custom-stamps'
import {
  Heart,
  Repeat2,
  Smile,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Edit,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { CommentInputForm } from '@/components/features'
import { TextWithUrlPreview } from '@/components/ui/text-with-url-preview'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  usePost,
  useDeletePost,
  useUpdatePost,
  useLikePost,
  useUnlikePost,
  useRepost,
  useUnrepost,
} from '@/hooks/use-posts'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/use-comments'
import {
  useReactions,
  useAddReaction,
  useRemoveReaction,
  type ReactionGroup,
} from '@/hooks/use-reactions'
import {
  useCommentLikes,
  useLikeComment,
  useUnlikeComment,
} from '@/hooks/use-comment-likes'
import { ReactionButton } from '@/components/features'
import { createClient } from '@/lib/supabase/client'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditCommentDialogOpen, setIsEditCommentDialogOpen] = useState(false)
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({})
  const [selectedReaction, setSelectedReaction] = useState<ReactionGroup | null>(null)
  const [isReactionUsersOpen, setIsReactionUsersOpen] = useState(false)

  const { data: post, isLoading: isPostLoading, error: postError } = usePost(postId)
  const { data: comments = [], isLoading: isCommentsLoading } = useComments(postId)
  const { data: reactions = [] } = useReactions(postId)
  const { data: customStamps = [] } = useCustomStamps()
  const createCustomStamp = useCreateCustomStamp()

  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const repost = useRepost()
  const unrepost = useUnrepost()
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()

  // ユーザーIDを取得
  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.user) {
        setCurrentUserId(session.session.user.id)
      }
    }
    fetchUserId()
  }, [])

  // 投稿内容を編集フォームに反映
  useEffect(() => {
    if (post) {
      setEditContent(post.content || '')
    }
  }, [post])

  const isOwner = currentUserId === post?.user_id

  // いいね処理
  const handleLike = async () => {
    if (!post) return
    if (post.is_liked) {
      await unlikePost.mutateAsync(post.id)
    } else {
      await likePost.mutateAsync(post.id)
    }
  }

  // リポスト処理
  const handleRepost = async () => {
    if (!post) return
    if (post.is_reposted) {
      await unrepost.mutateAsync(post.id)
    } else {
      await repost.mutateAsync({ postId: post.id })
    }
  }

  // 削除処理
  const handleDelete = async () => {
    if (!post) return
    await deletePost.mutateAsync(post.id)
    setIsDeleteDialogOpen(false)
    router.push('/home')
  }

  // 更新処理
  const handleUpdate = async () => {
    if (!post || !editContent.trim()) return
    await updatePost.mutateAsync({
      postId: post.id,
      content: editContent,
    })
    setIsEditDialogOpen(false)
  }

  // コメント投稿処理
  const handleCreateComment = async (content: string, images?: File[]) => {
    if (!post) return
    await createComment.mutateAsync({
      postId: post.id,
      content,
      images,
    })
  }

  // コメント編集開始
  const handleStartEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId)
    setEditingCommentContent(content)
    setIsEditCommentDialogOpen(true)
  }

  // コメント更新処理
  const handleUpdateComment = async () => {
    if (!post || !editingCommentId || !editingCommentContent.trim()) return
    await updateComment.mutateAsync({
      commentId: editingCommentId,
      postId: post.id,
      content: editingCommentContent,
    })
    setIsEditCommentDialogOpen(false)
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  // コメント削除処理
  const handleDeleteComment = async (commentId: string) => {
    if (!post) return
    await deleteComment.mutateAsync({
      commentId,
      postId: post.id,
    })
  }

  // リアクション処理
  const handleReaction = async (emoji: string) => {
    if (!post) return
    const existingReaction = reactions.find((r) => r.emoji === emoji)

    try {
      if (existingReaction?.hasReacted) {
        await removeReaction.mutateAsync({
          postId: post.id,
          emoji,
        })
      } else {
        await addReaction.mutateAsync({
          postId: post.id,
          emoji,
        })
      }
    } catch (error) {
      console.error('リアクション処理エラー:', error)
    } finally {
      // 即座に閉じる
      setIsReactionPickerOpen(false)
    }
  }

  // よく使う絵文字
  const commonEmojis = ['👍', '❤️', '😊', '😂', '🎉', '🔥', '👏', '🙏']

  // コメントいいねボタンコンポーネント
  const CommentLikeButton = ({ commentId }: { commentId: string }) => {
    const { data: likeData } = useCommentLikes(commentId)
    const likeComment = useLikeComment()
    const unlikeComment = useUnlikeComment()

    const handleLike = async () => {
      if (likeData?.isLiked) {
        await unlikeComment.mutateAsync({ commentId })
      } else {
        await likeComment.mutateAsync({ commentId })
      }
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          handleLike()
        }}
        disabled={likeComment.isPending || unlikeComment.isPending}
        className={`h-7 gap-1 text-xs px-2 py-1 rounded-full transition-colors ${likeData?.isLiked
          ? 'text-red-500 hover:text-red-600 bg-red-50'
          : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
          }`}
      >
        <Heart
          className={`h-3 w-3 ${likeData?.isLiked ? 'fill-current' : ''}`}
        />
        {likeData && likeData.likesCount > 0 && (
          <span className="text-xs font-medium">{likeData.likesCount}</span>
        )}
      </Button>
    )
  }

  if (isPostLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="text-center text-red-500 py-8">投稿が見つかりませんでした</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* 戻るボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>

        {/* 投稿詳細 */}
        <Card className="bg-white rounded-xl shadow-sm border border-blue-100 mb-4">
          <CardContent className="p-6">
            <div className="flex gap-3">
              {/* アバター */}
              <div
                onClick={() => router.push(`/profile/${post.profiles.username}`)}
                className="cursor-pointer"
              >
                <Avatar className="h-12 w-12 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.profiles.display_name?.[0] || post.profiles.username[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

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
                          onClick={() => setIsEditDialogOpen(true)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* 投稿内容 */}
                {post.content && (
                  <TextWithUrlPreview
                    content={post.content}
                    className="text-base leading-relaxed mb-4"
                  />
                )}

                {/* 画像ギャラリー */}
                {post.post_images.length > 0 && (
                  <div
                    className={`grid gap-2 ${post.post_images.length === 1
                      ? 'grid-cols-1'
                      : post.post_images.length === 2
                        ? 'grid-cols-2'
                        : post.post_images.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2'
                      }`}
                  >
                    {post.post_images.slice(0, 4).map((image, index) => (
                      <div
                        key={image.id}
                        className={`relative overflow-hidden rounded-lg border cursor-pointer ${post.post_images.length === 3 && index === 0
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
                          className={`w-full object-cover transition-opacity duration-300 ${post.post_images.length === 1
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

                {/* アクションボタン */}
                <div className="flex items-center gap-6 pt-2">
                  {/* リポスト */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRepost}
                    disabled={repost.isPending || unrepost.isPending}
                    className={`h-9 gap-2 ${post.is_reposted
                      ? 'text-green-500 hover:text-green-600'
                      : 'text-gray-500 hover:text-green-500'
                      }`}
                  >
                    <Repeat2 className="h-5 w-5" />
                    {post.reposts_count > 0 && (
                      <span className="text-sm font-medium">{post.reposts_count}</span>
                    )}
                  </Button>

                  {/* いいね */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={likePost.isPending || unlikePost.isPending}
                    className={`h-9 gap-2 ${post.is_liked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-500 hover:text-red-500'
                      }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`}
                    />
                    {post.likes_count > 0 && (
                      <span className="text-sm font-medium">{post.likes_count}</span>
                    )}
                  </Button>

                  {/* リアクション */}
                  <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 text-gray-500 hover:text-yellow-500"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg" align="start">
                      {/* 絵文字ピッカー */}
                      <div className="mb-4">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            handleReaction(emojiData.emoji)
                          }}
                          width="100%"
                          height={300}
                          searchDisabled={true}
                          previewConfig={{
                            showPreview: false,
                          }}
                        />
                      </div>

                      {/* カスタムスタンプセクション */}
                      {customStamps.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">カスタムスタンプ</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {customStamps.slice(0, 8).map((stamp) => (
                              <Button
                                key={stamp.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(stamp.image_url)}
                                className="h-12 p-1 hover:bg-gray-100 rounded-lg"
                              >
                                <img
                                  src={stamp.image_url}
                                  alt={stamp.name || 'カスタムスタンプ'}
                                  className="w-full h-full object-cover rounded"
                                />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* カスタムスタンプ作成ボタン */}
                      <div className="border-t pt-3 mt-3">
                        <input
                          type="file"
                          id="custom-stamp-input-detail"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              createCustomStamp.mutate({ image: file })
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('custom-stamp-input-detail')?.click()}
                          disabled={createCustomStamp.isPending}
                          className="w-full text-sm"
                        >
                          {createCustomStamp.isPending ? '作成中...' : '+ カスタムスタンプ追加'}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* リアクション表示 */}
                {reactions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reactions.map((reaction) => {
                      // カスタムスタンプかどうか判定（URLかどうか）
                      const isCustomStamp = reaction.emoji.startsWith('http')

                      return (
                        <Popover
                          key={reaction.emoji}
                          open={selectedReaction?.emoji === reaction.emoji && isReactionUsersOpen}
                          onOpenChange={(open) => {
                            if (!open) {
                              setIsReactionUsersOpen(false)
                              setSelectedReaction(null)
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                // 同じリアクションが選択されている場合は削除、そうでなければユーザーリストを表示
                                if (selectedReaction?.emoji === reaction.emoji && isReactionUsersOpen) {
                                  handleReaction(reaction.emoji)
                                } else {
                                  setSelectedReaction(reaction)
                                  setIsReactionUsersOpen(true)
                                }
                              }}
                              className={`h-7 px-2 py-1 rounded-full text-sm gap-1 transition-colors cursor-pointer ${reaction.hasReacted
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {isCustomStamp ? (
                                <img
                                  src={reaction.emoji}
                                  alt="カスタムスタンプ"
                                  className="w-4 h-4 object-cover rounded"
                                />
                              ) : (
                                <span className="text-base">{reaction.emoji}</span>
                              )}
                              <span className="text-xs font-medium">{reaction.count}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 bg-white border border-gray-200 shadow-lg rounded-lg" align="start">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {isCustomStamp ? (
                                  <img
                                    src={reaction.emoji}
                                    alt="カスタムスタンプ"
                                    className="w-4 h-4 object-cover rounded"
                                  />
                                ) : (
                                  <span className="text-base">{reaction.emoji}</span>
                                )}
                                を押した人
                              </h4>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {reaction.users.map((user) => (
                                  <div
                                    key={user.id}
                                    onClick={() => {
                                      router.push(`/profile/${user.username}`)
                                      setIsReactionUsersOpen(false)
                                      setSelectedReaction(null)
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {user.display_name?.[0] || user.username[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-900">
                                      {user.display_name || user.username}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {/* コメントセクション */}
        <div className="space-y-4 pb-60">
          <h2 className="text-lg font-semibold text-gray-900">
            コメント {comments.length > 0 && `(${comments.length})`}
          </h2>

          {/* コメント一覧 */}
          {isCommentsLoading ? (
            <div className="text-center text-gray-500 py-4">読み込み中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              まだコメントがありません
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="bg-white rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div
                        onClick={() => router.push(`/profile/${comment.profiles.username}`)}
                        className="cursor-pointer"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                          <AvatarImage src={comment.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {comment.profiles.display_name?.[0] || comment.profiles.username[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {comment.profiles.display_name || comment.profiles.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: ja,
                              })}
                            </span>
                          </div>
                          {currentUserId === comment.user_id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEditComment(comment.id, comment.content)}
                                className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deleteComment.isPending}
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <TextWithUrlPreview
                          content={comment.content}
                          className="text-sm text-gray-800"
                        />

                        {/* コメント画像ギャラリー */}
                        {comment.comment_images.length > 0 && (
                          <div
                            className={`grid gap-2 mt-3 ${comment.comment_images.length === 1
                              ? 'grid-cols-1'
                              : comment.comment_images.length === 2
                                ? 'grid-cols-2'
                                : comment.comment_images.length === 3
                                  ? 'grid-cols-3'
                                  : 'grid-cols-2'
                              }`}
                          >
                            {comment.comment_images.slice(0, 4).map((image, index) => (
                              <div
                                key={image.id}
                                className={`relative overflow-hidden rounded-lg border cursor-pointer ${comment.comment_images.length === 3 && index === 0
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
                                  alt={`コメント画像 ${index + 1}`}
                                  className={`w-full object-cover transition-opacity duration-300 ${comment.comment_images.length === 1
                                    ? 'max-h-[400px]'
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

                        {/* コメントアクション */}
                        <div className="flex items-center gap-3 mt-2">
                          {/* いいねボタン */}
                          <CommentLikeButton commentId={comment.id} />

                          {/* リアクションボタン */}
                          <ReactionButton
                            targetId={comment.id}
                            isComment={true}
                            className=""
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* コメント入力フォーム */}
          <CommentInputForm
            onSubmit={handleCreateComment}
            isLoading={createComment.isPending}
          />
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>投稿を削除しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。投稿と関連する画像が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>投稿を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="投稿内容を入力"
              className="min-h-[150px] rounded-lg resize-none"
            />
            <div className="text-sm text-gray-600">
              {editContent.length} / 500
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                updatePost.isPending ||
                !editContent.trim() ||
                editContent.length > 500
              }
            >
              {updatePost.isPending ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* コメント編集ダイアログ */}
      <Dialog open={isEditCommentDialogOpen} onOpenChange={setIsEditCommentDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>コメントを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Textarea
              value={editingCommentContent}
              onChange={(e) => setEditingCommentContent(e.target.value)}
              placeholder="コメント内容を入力"
              className="min-h-[120px] rounded-lg resize-none"
            />
            <div className="text-sm text-gray-600">
              {editingCommentContent.length} / 500
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCommentDialogOpen(false)
                setEditingCommentId(null)
                setEditingCommentContent('')
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateComment}
              disabled={
                updateComment.isPending ||
                !editingCommentContent.trim() ||
                editingCommentContent.length > 500
              }
            >
              {updateComment.isPending ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 画像フルスクリーン表示 */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <img
            src={selectedImage || ''}
            alt="投稿画像"
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
