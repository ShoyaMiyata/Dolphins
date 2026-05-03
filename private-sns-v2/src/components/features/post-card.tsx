'use client'

import { useState, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { TextWithUrlPreview } from '@/components/ui/text-with-url-preview'
import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { motion } from 'framer-motion'
import EmojiPicker from 'emoji-picker-react'
import { Repeat2, Smile } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  useDeletePost,
  useUpdatePost,
  useLikePost,
  useUnlikePost,
  useRepost,
  useUnrepost,
  type PostWithDetails,
} from '@/hooks/use-posts'
import { useDeleteGroupPost, useUpdateGroupPost } from '@/hooks/use-group-posts'
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
import { useAuthStore } from '@/stores/auth-store'

import { PostActions } from './post-card/post-actions'
import { PostImages } from './post-card/post-images'
import { PostMenu } from './post-card/post-menu'
import { DeletePostDialog } from './post-card/delete-post-dialog'
import { RepostDialog } from './post-card/repost-dialog'
import { EditPostDialog } from './post-card/edit-post-dialog'
import { ImageViewer } from './post-card/image-viewer'

export interface PostCardProps {
  post: PostWithDetails
  groupId?: string
  isDetail?: boolean
  onPostDeleted?: () => void
}

function PostCard({ post, groupId, isDetail = false, onPostDeleted }: PostCardProps) {
  const router = useRouter()
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const [repostComment, setRepostComment] = useState('')
  const [editContent, setEditContent] = useState(post.content || '')
  const [editImages, setEditImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedReaction, setSelectedReaction] = useState<ReactionGroup | null>(null)
  const [isReactionUsersOpen, setIsReactionUsersOpen] = useState(false)

  const isRepost = post.type === 'repost'
  const isGroupRepost = isRepost && !!post.original_group_post_id
  const displayPost = isRepost
    ? (post.original_post || post.original_group_post || post)
    : post

  const isGroupPost = !!groupId
  const isOwner = currentUserId === post.user_id

  const deletePost = useDeletePost()
  const deleteGroupPost = useDeleteGroupPost()
  const updatePost = useUpdatePost()
  const updateGroupPost = useUpdateGroupPost()

  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const likeGroupPost = useLikeGroupPost()
  const unlikeGroupPost = useUnlikeGroupPost()

  const repost = useRepost()
  const unrepost = useUnrepost()

  const { data: standardReactions = [] } = useReactions(isGroupPost ? null : post.id)
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()

  const { data: groupReactions = [] } = useGroupPostReactions(isGroupPost ? post.id : '')
  const addGroupPostReaction = useAddGroupPostReaction()
  const removeGroupPostReaction = useRemoveGroupPostReaction()

  const reactions = isGroupPost ? groupReactions : standardReactions

  const { data: customStamps = [] } = useCustomStamps()
  const createCustomStamp = useCreateCustomStamp()

  const createdAt = useMemo(() => new Date(post.created_at), [post.created_at])
  const relativeTime = useMemo(
    () => formatDistanceToNow(createdAt, { addSuffix: true, locale: ja }),
    [createdAt]
  )
  const absoluteTime = useMemo(
    () => format(createdAt, 'yyyy/MM/dd HH:mm', { locale: ja }),
    [createdAt]
  )

  const handleLike = async () => {
    if (isGroupPost) {
      if (post.is_liked) unlikeGroupPost.mutate({ postId: post.id })
      else likeGroupPost.mutate({ postId: post.id })
    } else {
      if (post.is_liked) await unlikePost.mutateAsync(post.id)
      else await likePost.mutateAsync(post.id)
    }
  }

  const handleRepost = async () => {
    if (post.is_reposted) {
      await unrepost.mutateAsync(post.id)
    } else {
      setIsRepostDialogOpen(true)
    }
  }

  const handleRepostConfirm = async () => {
    await repost.mutateAsync({
      postId: !isGroupPost ? post.id : undefined,
      groupPostId: isGroupPost ? post.id : undefined,
      comment: repostComment.trim() || undefined,
    })
    setIsRepostDialogOpen(false)
    setRepostComment('')
  }

  const handleDelete = async () => {
    if (isGroupPost && groupId) {
      await deleteGroupPost.mutateAsync({ postId: post.id, groupId })
    } else {
      await deletePost.mutateAsync(post.id)
    }
    setIsDeleteDialogOpen(false)
    onPostDeleted?.()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remainingSlots = 4 - editImages.length
    const newFiles = files.slice(0, remainingSlots)
    setEditImages((prev) => [...prev, ...newFiles])
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index))
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdate = async () => {
    if (!editContent.trim() && editImages.length === 0) return

    if (isGroupPost && groupId) {
      await updateGroupPost.mutateAsync({
        postId: post.id,
        groupId,
        content: editContent,
        images: editImages.length > 0 ? editImages : undefined,
      })
    } else {
      await updatePost.mutateAsync({ postId: post.id, content: editContent })
    }

    setIsEditDialogOpen(false)
    setEditImages([])
    setEditImagePreviews([])
  }

  const handleReaction = async (emoji: string) => {
    setIsReactionPickerOpen(false)

    const targetReaction = reactions.find((r) => r.emoji === emoji)
    const hasReacted = !!targetReaction?.hasReacted

    if (isGroupPost) {
      if (hasReacted) {
        await removeGroupPostReaction.mutateAsync({ postId: post.id, emoji })
      } else {
        await addGroupPostReaction.mutateAsync({ postId: post.id, emoji })
      }
    } else {
      if (hasReacted) {
        await removeReaction.mutateAsync({ postId: post.id, emoji })
      } else {
        await addReaction.mutateAsync({ postId: post.id, emoji })
      }
    }
  }

  const handlePostClick = () => {
    if (isDetail) return
    if (groupId) {
      router.push(`/groups/${groupId}/posts/${post.id}`)
    } else {
      router.push(`/home/${post.id}`)
    }
  }

  const handleCommentClick = () => {
    if (isDetail) return
    handlePostClick()
  }

  const isLikeMutating = likePost.isPending || unlikePost.isPending
  const isRepostMutating = repost.isPending || unrepost.isPending
  const isDeletePending = isGroupPost ? deleteGroupPost.isPending : deletePost.isPending
  const isUpdatePending = isGroupPost ? updateGroupPost.isPending : updatePost.isPending

  const allImages = useMemo(() => {
    const post1 = displayPost.post_images || []
    const post2 = ((displayPost as unknown as { group_post_images?: Array<{ id: string; image_url: string }> }).group_post_images) || []
    return [...post1, ...post2]
  }, [displayPost])

  return (
    <>
      <Card
        className={`bg-white rounded-xl shadow-sm border border-blue-100 mb-3 ${
          isDetail ? '' : 'hover:shadow-lg hover:border-blue-200 transition-all duration-200'
        }`}
      >
        <CardContent
          className={`p-4 ${isDetail ? '' : 'cursor-pointer'}`}
          onClick={handlePostClick}
        >
          {isRepost && (post.original_post || post.original_group_post) && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <Repeat2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">
                {post.profiles.display_name || post.profiles.username} が
                {isGroupRepost ? 'グループ投稿を' : ''}リポストしました
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <div
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/profile/${post.profiles.username}`)
              }}
              className="cursor-pointer"
            >
              <Avatar className="h-11 w-11 flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
                <AvatarImage src={post.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {post.profiles.display_name?.[0] || post.profiles.username[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate">
                    {post.profiles.display_name || post.profiles.username}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    @{post.profiles.username} ·{' '}
                    <time dateTime={post.created_at} title={absoluteTime}>
                      {relativeTime}
                    </time>
                  </span>
                </div>

                {isOwner && (
                  <PostMenu
                    onEdit={() => setIsEditDialogOpen(true)}
                    onDelete={() => setIsDeleteDialogOpen(true)}
                  />
                )}
              </div>

              {isRepost && post.content && (
                <div className="mb-3">
                  <TextWithUrlPreview
                    content={post.content}
                    className="text-sm leading-relaxed"
                  />
                </div>
              )}

              {(displayPost.content ||
                ((displayPost as unknown as { group_post_images?: unknown[] }).group_post_images?.length ?? 0) > 0) && (
                <div
                  className={
                    isRepost
                      ? 'p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors'
                      : ''
                  }
                  onClick={(e) => {
                    if (isRepost) {
                      e.stopPropagation()
                      if (post.original_group_post_id && post.original_group_post) {
                        router.push(
                          `/groups/${post.original_group_post.group_id}/posts/${post.original_group_post_id}`
                        )
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
                          {displayPost.profiles.display_name?.[0] ||
                            displayPost.profiles.username[0]}
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
                      className={`text-sm leading-relaxed ${isRepost ? 'text-gray-700' : ''}`}
                    />
                  )}
                </div>
              )}

              <PostImages images={allImages} onImageClick={setSelectedImage} />

              <PostActions
                commentsCount={post.comments_count}
                repostsCount={post.reposts_count}
                likesCount={post.likes_count}
                isLiked={post.is_liked}
                isReposted={post.is_reposted}
                isMutating={isLikeMutating || isRepostMutating}
                onComment={handleCommentClick}
                onRepost={handleRepost}
                onLike={handleLike}
                rightSlot={
                  <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
                    <PopoverTrigger asChild>
                      <motion.div whileTap={{ scale: 0.92 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="リアクションを追加"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 gap-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 px-2.5 py-1 rounded-full transition-colors"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 p-3 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg"
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-4">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            handleReaction(emojiData.emoji)
                          }}
                          width="100%"
                          height={300}
                          searchDisabled={true}
                          previewConfig={{ showPreview: false }}
                        />
                      </div>

                      {customStamps.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            カスタムスタンプ
                          </h4>
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
                          onClick={() =>
                            document.getElementById('custom-stamp-input')?.click()
                          }
                          disabled={createCustomStamp.isPending}
                          className="w-full text-sm"
                        >
                          {createCustomStamp.isPending
                            ? '作成中...'
                            : '+ カスタムスタンプ追加'}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                }
              />

              {reactions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reactions.map((reaction) => {
                    const isCustomStamp = reaction.emoji.startsWith('http')
                    return (
                      <Popover
                        key={reaction.emoji}
                        open={
                          selectedReaction?.emoji === reaction.emoji && isReactionUsersOpen
                        }
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
                            aria-label={`${reaction.emoji} ${reaction.count}件`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                selectedReaction?.emoji === reaction.emoji &&
                                isReactionUsersOpen
                              ) {
                                handleReaction(reaction.emoji)
                              } else {
                                setSelectedReaction(reaction)
                                setIsReactionUsersOpen(true)
                              }
                            }}
                            className={`h-7 px-2 py-1 rounded-full text-sm gap-1 transition-colors cursor-pointer ${
                              reaction.hasReacted
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
                        <PopoverContent
                          className="w-64 p-3 bg-white border border-gray-200 shadow-lg rounded-lg"
                          align="start"
                        >
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

      <DeletePostDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={isDeletePending}
      />

      <RepostDialog
        open={isRepostDialogOpen}
        onOpenChange={(open) => {
          setIsRepostDialogOpen(open)
          if (!open) setRepostComment('')
        }}
        comment={repostComment}
        setComment={setRepostComment}
        onConfirm={handleRepostConfirm}
        isPending={repost.isPending}
      />

      <EditPostDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editContent={editContent}
        setEditContent={setEditContent}
        editImagePreviews={editImagePreviews}
        editImages={editImages}
        onImageSelect={handleImageSelect}
        onRemoveImage={handleRemoveImage}
        onSubmit={handleUpdate}
        isPending={isUpdatePending}
      />

      <ImageViewer imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  )
}

export default memo(PostCard, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.is_liked === next.post.is_liked &&
    prev.post.is_reposted === next.post.is_reposted &&
    prev.post.likes_count === next.post.likes_count &&
    prev.post.comments_count === next.post.comments_count &&
    prev.post.reposts_count === next.post.reposts_count &&
    prev.post.content === next.post.content &&
    prev.groupId === next.groupId &&
    prev.isDetail === next.isDetail
  )
})
