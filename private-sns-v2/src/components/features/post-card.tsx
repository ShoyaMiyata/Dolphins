'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { TextWithUrlPreview } from '@/components/ui/text-with-url-preview'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Smile,
  MoreHorizontal,
  Trash2,
  Edit,
} from 'lucide-react'
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
import {
  useDeletePost,
  useUpdatePost,
  useLikePost,
  useUnlikePost,
  useRepost,
  useUnrepost,
  type PostWithDetails,
} from '@/hooks/use-posts'
import {
  useDeleteGroupPost,
  useUpdateGroupPost,
} from '@/hooks/use-group-posts'
import {
  useLikeGroupPost,
  useUnlikeGroupPost,
} from '@/hooks/use-group-post-likes'
import {
  useReactions,
  useAddReaction,
  useRemoveReaction,
  type ReactionGroup,
} from '@/hooks/use-reactions'
import {
  useGroupPostReactions,
  useAddGroupPostReaction,
  useRemoveGroupPostReaction,
} from '@/hooks/use-group-post-reactions'
import {
  useCustomStamps,
  useCreateCustomStamp,
} from '@/hooks/use-custom-stamps'
import { createClient } from '@/lib/supabase/client'

export interface PostCardProps {
  post: PostWithDetails
  groupId?: string // グループIDを追加（グループ投稿の場合に使用）
  isDetail?: boolean // 投稿詳細ページでの表示かどうか
  onPostDeleted?: () => void // 削除完了時のコールバック
}

function PostCard({ post, groupId, isDetail = false, onPostDeleted }: PostCardProps) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const [repostComment, setRepostComment] = useState('')
  const [editContent, setEditContent] = useState(post.content || '')
  const [editImages, setEditImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({})
  const [selectedReaction, setSelectedReaction] = useState<ReactionGroup | null>(null)
  const [isReactionUsersOpen, setIsReactionUsersOpen] = useState(false)

  // リポストの場合、表示するデータを元の投稿に切り替え
  const displayPost = post.type === 'repost'
    ? (post.original_post || post.original_group_post || post)
    : post
  const isRepost = post.type === 'repost'
  const isGroupRepost = isRepost && !!post.original_group_post_id

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // グループ投稿かどうかで使用するフックを切り替え
  const isGroupPost = !!groupId

  const deletePost = useDeletePost()
  const deleteGroupPost = useDeleteGroupPost()
  const updatePost = useUpdatePost()
  const updateGroupPost = useUpdateGroupPost()

  // いいねフック
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const likeGroupPost = useLikeGroupPost()
  const unlikeGroupPost = useUnlikeGroupPost()

  const repost = useRepost()
  const unrepost = useUnrepost()

  // リアクションフック
  // 通常投稿用
  const { data: standardReactions = [] } = useReactions(isGroupPost ? null : post.id)
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()

  // グループ投稿用
  const { data: groupReactions = [] } = useGroupPostReactions(isGroupPost ? post.id : '')
  const addGroupPostReaction = useAddGroupPostReaction()
  const removeGroupPostReaction = useRemoveGroupPostReaction()

  // 表示するリアクション
  const reactions = isGroupPost ? groupReactions : standardReactions

  const { data: customStamps = [] } = useCustomStamps()
  const createCustomStamp = useCreateCustomStamp()

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

  const isOwner = currentUserId === post.user_id

  // 相対時間表示
  const relativeTime = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ja,
  })

  // いいね処理
  const handleLike = async () => {
    if (isGroupPost) {
      if (post.is_liked) {
        unlikeGroupPost.mutate({ postId: post.id })
      } else {
        likeGroupPost.mutate({ postId: post.id })
      }
    } else {
      if (post.is_liked) {
        await unlikePost.mutateAsync(post.id)
      } else {
        await likePost.mutateAsync(post.id)
      }
    }
  }

  // リポスト処理
  const handleRepost = async () => {
    if (post.is_reposted) {
      await unrepost.mutateAsync(post.id)
    } else {
      setIsRepostDialogOpen(true)
    }
  }

  // リポスト実行
  const handleRepostConfirm = async () => {
    await repost.mutateAsync({
      postId: !isGroupPost ? post.id : undefined,
      groupPostId: isGroupPost ? post.id : undefined,
      comment: repostComment.trim() || undefined,
    })
    setIsRepostDialogOpen(false)
    setRepostComment('')
  }

  // 削除処理
  const handleDelete = async () => {
    if (isGroupPost && groupId) {
      // グループ投稿の削除
      await deleteGroupPost.mutateAsync({
        postId: post.id,
        groupId: groupId,
      })
    } else {
      // 通常の投稿の削除
      await deletePost.mutateAsync(post.id)
    }
    setIsDeleteDialogOpen(false)
    if (onPostDeleted) {
      onPostDeleted()
    }
  }

  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 既存の画像と合わせて4枚まで
    const remainingSlots = 4 - editImages.length
    const newFiles = files.slice(0, remainingSlots)

    setEditImages((prev) => [...prev, ...newFiles])

    // プレビュー生成
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // 画像削除処理
  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index))
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // 更新処理
  const handleUpdate = async () => {
    if (!editContent.trim() && editImages.length === 0) return

    if (isGroupPost && groupId) {
      // グループ投稿の更新（画像も含む）
      await updateGroupPost.mutateAsync({
        postId: post.id,
        groupId: groupId,
        content: editContent,
        images: editImages.length > 0 ? editImages : undefined,
      })
    } else {
      // 通常の投稿の更新（現在は画像追加非対応）
      await updatePost.mutateAsync({
        postId: post.id,
        content: editContent,
      })
    }
    setIsEditDialogOpen(false)
    setEditImages([])
    setEditImagePreviews([])
  }

  // 投稿詳細ページへ遷移
  const handlePostClick = (e: React.MouseEvent) => {
    if (isDetail) return // 詳細ページの場合は遷移しない

    // ボタンやリンクなどのクリックは除外
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.tagName === 'IMG'
    ) {
      return
    }
    // グループ投稿の場合はグループ投稿詳細ページに遷移
    if (groupId) {
      router.push(`/groups/${groupId}/posts/${post.id}`)
    } else {
      router.push(`/home/${post.id}`)
    }
  }

  // リアクション処理
  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji)

    try {
      if (isGroupPost) {
        if (existingReaction?.hasReacted) {
          // 既にリアクションしている場合は削除
          await removeGroupPostReaction.mutateAsync({
            postId: post.id,
            emoji,
          })
        } else {
          // リアクションを追加
          await addGroupPostReaction.mutateAsync({
            postId: post.id,
            emoji,
          })
        }
      } else {
        if (existingReaction?.hasReacted) {
          // 既にリアクションしている場合は削除
          await removeReaction.mutateAsync({
            postId: post.id,
            emoji,
          })
        } else {
          // リアクションを追加
          await addReaction.mutateAsync({
            postId: post.id,
            emoji,
          })
        }
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

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
        }}
      >
        <Card className={`bg-white rounded-xl shadow-sm border border-blue-100 mb-3 ${isDetail ? '' : 'hover:shadow-lg hover:border-blue-200 transition-all duration-200'
          }`}>
          <CardContent className={`p-4 ${isDetail ? '' : 'cursor-pointer'}`} onClick={handlePostClick}>
            {/* リポストの場合のリポスト情報 */}
            {isRepost && (post.original_post || post.original_group_post) && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Repeat2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  {post.profiles.display_name || post.profiles.username} が{isGroupRepost ? 'グループ投稿を' : ''}リポストしました
                </span>
              </div>
            )}

            <div className="flex gap-3">
              {/* アバター */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/profile/${post.profiles.username}`)
                }}
                className="cursor-pointer"
              >
                <Avatar className="h-10 w-10 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.profiles.display_name?.[0] || post.profiles.username[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-2">
                {/* ヘッダー */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {post.profiles.display_name || post.profiles.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      @{post.profiles.username} · {relativeTime}
                    </span>
                  </div>

                  {/* オプションメニュー（投稿者のみ） */}
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 -mt-1 -mr-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={8} className="border-blue-100 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditDialogOpen(true)
                          }}
                          className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4 text-blue-500" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* リポストコメント（リポストの場合のみ） */}
                {isRepost && post.content && (
                  <div className="mb-3">
                    <TextWithUrlPreview
                      content={post.content}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                )}

                {/* 投稿内容 */}
                {(displayPost.content || (displayPost as any).group_post_images?.length > 0) && (
                  <div
                    className={isRepost ? "p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors" : ""}
                    onClick={(e) => {
                      if (isRepost) {
                        e.stopPropagation()
                        if (post.original_group_post_id) {
                          router.push(`/groups/${post.original_group_post.group_id}/posts/${post.original_group_post_id}`)
                        } else if (post.original_post_id) {
                          router.push(`/home/${post.original_post_id}`)
                        }
                      }
                    }}
                  >
                    {isRepost && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={displayPost.profiles.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {displayPost.profiles.display_name?.[0] || displayPost.profiles.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-gray-700">
                          {displayPost.profiles.display_name || displayPost.profiles.username}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          @{displayPost.profiles.username}
                        </span>
                      </div>
                    )}
                    {displayPost.content && (
                      <TextWithUrlPreview
                        content={displayPost.content}
                        className={`text-sm leading-relaxed ${isRepost ? "text-gray-700" : ""}`}
                      />
                    )}
                  </div>
                )}

                {/* 画像ギャラリー */}
                {((displayPost.post_images && displayPost.post_images.length > 0) ||
                  ((displayPost as any).group_post_images && (displayPost as any).group_post_images.length > 0)) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`grid gap-2 mt-3 ${((displayPost.post_images?.length || 0) + ((displayPost as any).group_post_images?.length || 0)) === 1
                        ? 'grid-cols-1'
                        : ((displayPost.post_images?.length || 0) + ((displayPost as any).group_post_images?.length || 0)) === 2
                          ? 'grid-cols-2'
                          : ((displayPost.post_images?.length || 0) + ((displayPost as any).group_post_images?.length || 0)) === 3
                            ? 'grid-cols-3'
                            : 'grid-cols-2'
                        }`}
                    >
                      {[...(displayPost.post_images || []), ...((displayPost as any).group_post_images || [])].slice(0, 4).map((image: any, index: number) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative overflow-hidden rounded-lg border cursor-pointer ${displayPost.post_images.length === 3 && index === 0
                            ? 'col-span-3'
                            : displayPost.post_images.length > 3 && index === 3
                              ? 'relative'
                              : ''
                            }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(image.image_url)
                          }}
                        >
                          {/* Image Loading Blur */}
                          {!imageLoaded[image.id] && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                          )}
                          <img
                            src={image.image_url}
                            alt={`投稿画像 ${index + 1}`}
                            className={`w-full object-cover transition-opacity duration-300 ${displayPost.post_images.length === 1
                              ? 'max-h-[400px]'
                              : 'aspect-square'
                              } ${imageLoaded[image.id] ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() =>
                              setImageLoaded((prev) => ({ ...prev, [image.id]: true }))
                            }
                            loading="lazy"
                          />
                          {displayPost.post_images.length > 4 && index === 3 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-2xl font-bold"
                            >
                              +{displayPost.post_images.length - 4}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                {/* アクションボタン */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex items-center justify-between pt-2 max-w-md"
                >
                  {/* コメント */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isDetail) return // 詳細ページの場合は遷移しない

                        // グループ投稿の場合はグループ投稿詳細ページに遷移
                        if (groupId) {
                          router.push(`/groups/${groupId}/posts/${post.id}`)
                        } else {
                          router.push(`/home/${post.id}`)
                        }
                      }}
                      className="h-8 gap-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count > 0 && (
                        <span className="text-xs font-medium">{post.comments_count}</span>
                      )}
                    </Button>
                  </motion.div>

                  {/* リポスト */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={post.is_reposted ? { rotate: [0, 15, -15, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRepost()
                      }}
                      disabled={repost.isPending || unrepost.isPending}
                      className={`h-8 gap-1.5 px-2 py-1 rounded-full transition-colors ${post.is_reposted
                        ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                        : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
                        }`}
                    >
                      <Repeat2 className="h-4 w-4" />
                      {post.reposts_count > 0 && (
                        <span className="text-xs font-medium">{post.reposts_count}</span>
                      )}
                    </Button>
                  </motion.div>

                  {/* いいね */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike()
                      }}
                      disabled={likePost.isPending || unlikePost.isPending}
                      className={`h-8 gap-1.5 px-2 py-1 rounded-full transition-colors ${post.is_liked
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                    >
                      <motion.div
                        animate={post.is_liked ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart
                          className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`}
                        />
                      </motion.div>
                      {post.likes_count > 0 && (
                        <span className="text-xs font-medium">{post.likes_count}</span>
                      )}
                    </Button>
                  </motion.div>

                  {/* リアクション */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 gap-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 px-2 py-1 rounded-full transition-colors"
                        >
                          <Smile className="h-4 w-4" />
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
                            id="custom-stamp-input"
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
                            onClick={() => document.getElementById('custom-stamp-input')?.click()}
                            disabled={createCustomStamp.isPending}
                            className="w-full text-sm"
                          >
                            {createCustomStamp.isPending ? '作成中...' : '+ カスタムスタンプ追加'}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                </motion.div>

                {/* リアクション表示 */}
                {reactions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mt-2"
                  >
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
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-blue-900">投稿を削除しますか？</DialogTitle>
            <DialogDescription className="text-sm text-blue-700">
              この操作は取り消せません。投稿と関連する画像が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 rounded-lg border-blue-100"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isGroupPost ? deleteGroupPost.isPending : deletePost.isPending}
              className="flex-1 rounded-lg"
            >
              {(isGroupPost ? deleteGroupPost.isPending : deletePost.isPending) ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* リポストダイアログ */}
      <Dialog open={isRepostDialogOpen} onOpenChange={setIsRepostDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-blue-900">リポスト</DialogTitle>
            <DialogDescription className="text-sm text-blue-700">
              リポストにコメントを追加できます（オプション）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Textarea
              value={repostComment}
              onChange={(e) => setRepostComment(e.target.value)}
              placeholder="コメントを追加（任意）"
              className="min-h-[100px] rounded-lg border-blue-100 resize-none text-blue-900"
            />
            <div className="text-sm text-blue-600">
              {repostComment.length} / 500
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRepostDialogOpen(false)
                setRepostComment('')
              }}
              className="flex-1 rounded-lg border-blue-100"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleRepostConfirm}
              disabled={repost.isPending || repostComment.length > 500}
              className="flex-1 rounded-lg bg-green-500 hover:bg-green-600"
            >
              {repost.isPending ? 'リポスト中...' : 'リポスト'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-blue-900">投稿を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="投稿内容を入力"
              className="min-h-[150px] rounded-lg border-blue-100 resize-none text-blue-900"
            />
            <div className="text-sm text-blue-600">
              {editContent.length} / 500
            </div>

            {/* 画像プレビュー */}
            {editImagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {editImagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`プレビュー ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 画像追加ボタン */}
            {editImages.length < 4 && (
              <div>
                <input
                  type="file"
                  id="edit-image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('edit-image-upload')?.click()}
                  className="w-full"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  画像を追加 ({editImages.length}/4)
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1 rounded-lg border-blue-100"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                (isGroupPost ? updateGroupPost.isPending : updatePost.isPending) ||
                (!editContent.trim() && editImages.length === 0) ||
                editContent.length > 500
              }
              className="flex-1 rounded-lg"
            >
              {(isGroupPost ? updateGroupPost.isPending : updatePost.isPending) ? '更新中...' : '更新'}
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
    </>
  )
}

// React.memoでメモ化してエクスポート
export default memo(PostCard, (prevProps, nextProps) => {
  // post.idが同じ場合は再レンダリングをスキップ
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_liked === nextProps.post.is_liked &&
    prevProps.post.is_reposted === nextProps.post.is_reposted &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.reposts_count === nextProps.post.reposts_count &&
    prevProps.groupId === nextProps.groupId
  )
})
