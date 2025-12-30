'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
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
import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: PostWithDetails
}

export function PostCard({ post }: PostCardProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({})

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const repost = useRepost()
  const unrepost = useUnrepost()

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
    if (post.is_liked) {
      await unlikePost.mutateAsync(post.id)
    } else {
      await likePost.mutateAsync(post.id)
    }
  }

  // リポスト処理
  const handleRepost = async () => {
    if (post.is_reposted) {
      await unrepost.mutateAsync(post.id)
    } else {
      await repost.mutateAsync(post.id)
    }
  }

  // 削除処理
  const handleDelete = async () => {
    await deletePost.mutateAsync(post.id)
    setIsDeleteDialogOpen(false)
  }

  // 更新処理
  const handleUpdate = async () => {
    if (!editContent.trim()) return

    await updatePost.mutateAsync({
      postId: post.id,
      content: editContent,
    })
    setIsEditDialogOpen(false)
  }

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
        <Card className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 mb-3 border border-blue-100 hover:border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
            {/* アバター */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={post.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {post.profiles.display_name?.[0] || post.profiles.username[0]}
              </AvatarFallback>
            </Avatar>

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
                        className="h-8 w-8 -mt-1 -mr-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="border-blue-100 shadow-lg">
                      <DropdownMenuItem
                        onClick={() => setIsEditDialogOpen(true)}
                        className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4 text-blue-500" />
                        編集
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              )}

              {/* 画像ギャラリー */}
              {post.post_images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className={`grid gap-2 mt-3 ${
                    post.post_images.length === 1
                      ? 'grid-cols-1'
                      : post.post_images.length === 2
                        ? 'grid-cols-2'
                        : post.post_images.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2'
                  }`}
                >
                  {post.post_images.slice(0, 4).map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative overflow-hidden rounded-lg border cursor-pointer ${
                        post.post_images.length === 3 && index === 0
                          ? 'col-span-3'
                          : post.post_images.length > 3 && index === 3
                            ? 'relative'
                            : ''
                      }`}
                      onClick={() => setSelectedImage(image.image_url)}
                    >
                      {/* Image Loading Blur */}
                      {!imageLoaded[image.id] && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                      )}
                      <img
                        src={image.image_url}
                        alt={`投稿画像 ${index + 1}`}
                        className={`w-full object-cover transition-opacity duration-300 ${
                          post.post_images.length === 1
                            ? 'max-h-[400px]'
                            : 'aspect-square'
                        } ${imageLoaded[image.id] ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() =>
                          setImageLoaded((prev) => ({ ...prev, [image.id]: true }))
                        }
                        loading="lazy"
                      />
                      {post.post_images.length > 4 && index === 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-2xl font-bold"
                        >
                          +{post.post_images.length - 4}
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
                    onClick={handleRepost}
                    disabled={repost.isPending || unrepost.isPending}
                    className={`h-8 gap-1.5 px-2 py-1 rounded-full transition-colors ${
                      post.is_reposted
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
                    onClick={handleLike}
                    disabled={likePost.isPending || unlikePost.isPending}
                    className={`h-8 gap-1.5 px-2 py-1 rounded-full transition-colors ${
                      post.is_liked
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 px-2 py-1 rounded-full transition-colors"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
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
              disabled={deletePost.isPending}
              className="flex-1 rounded-lg"
            >
              {deletePost.isPending ? '削除中...' : '削除'}
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
                updatePost.isPending ||
                !editContent.trim() ||
                editContent.length > 500
              }
              className="flex-1 rounded-lg"
            >
              {updatePost.isPending ? '更新中...' : '更新'}
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
