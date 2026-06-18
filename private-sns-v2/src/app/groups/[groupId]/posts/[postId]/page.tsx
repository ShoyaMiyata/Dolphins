'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    ArrowLeft,
    Trash2,
    Edit,
} from 'lucide-react'
import { CommentInputForm } from '@/components/features'
import PostCard from '@/components/features/post-card' // Import PostCard
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    useGroupPost,
} from '@/hooks/use-group-posts'
import {
    useGroupPostComments,
    useCreateGroupPostComment,
    useUpdateGroupPostComment,
    useDeleteGroupPostComment,
} from '@/hooks/use-group-post-comments'
import {
    useLikeGroupPost,
    useUnlikeGroupPost,
} from '@/hooks/use-group-post-likes'
import {
    useAddGroupPostReaction,
    useRemoveGroupPostReaction,
    useGroupPostCommentReactions,
} from '@/hooks/use-group-post-reactions'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TextWithUrlPreview } from '@/components/ui/text-with-url-preview'
import { Heart, Smile, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export default function GroupPostDetailPage() {
    const params = useParams()
    const router = useRouter()
    const groupId = params.groupId as string
    const postId = params.postId as string

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    // Post-related state handling is now delegated to PostCard
    const [isEditCommentDialogOpen, setIsEditCommentDialogOpen] = useState(false)
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editingCommentContent, setEditingCommentContent] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({})

    const { data: post, isLoading: isPostLoading, error: postError } = useGroupPost(groupId, postId)
    const { data: comments = [], isLoading: isCommentsLoading } = useGroupPostComments(postId)

    const createComment = useCreateGroupPostComment()
    const updateComment = useUpdateGroupPostComment()
    const deleteComment = useDeleteGroupPostComment()

    const likeGroupPost = useLikeGroupPost()
    const unlikeGroupPost = useUnlikeGroupPost()
    const addGroupPostReaction = useAddGroupPostReaction()
    const removeGroupPostReaction = useRemoveGroupPostReaction()

    const EMOJI_LIST = ['👍', '❤️', '🔥', '👏', '😊', '😮', '😢', '🙏']

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

    // コメント投稿処理
    const handleCreateComment = async (content: string, images?: File[]) => {
        if (!post) return
        await createComment.mutateAsync({
            groupPostId: post.id,
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
            groupPostId: post.id,
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
            groupPostId: post.id,
        })
    }

    // コメントいいね処理
    const handleToggleCommentLike = async (commentId: string, isLiked: boolean) => {
        if (isLiked) {
            await unlikeGroupPost.mutateAsync({ commentId })
        } else {
            await likeGroupPost.mutateAsync({ commentId })
        }
    }

    // コメントリアクション処理
    const handleToggleCommentReaction = async (commentId: string, emoji: string, hasReacted: boolean) => {
        if (hasReacted) {
            await removeGroupPostReaction.mutateAsync({ commentId, emoji })
        } else {
            await addGroupPostReaction.mutateAsync({ commentId, emoji })
        }
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
                    onClick={() => router.push(`/groups/${groupId}`)}
                    className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    グループに戻る
                </Button>

                {/* 投稿詳細 (PostCardを利用) */}
                <PostCard
                    post={{
                        id: post.id,
                        user_id: post.user_id,
                        content: post.content,
                        type: 'post',
                        original_post_id: null,
                        original_group_post_id: null,
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
                        comments_count: post.comments_count || 0,
                        likes_count: post.likes_count || 0,
                        reposts_count: post.reposts_count || 0,
                        is_liked: post.is_liked || false,
                        is_reposted: post.is_reposted || false,
                        is_pinned: post.is_pinned || false,
                        pinned_at: post.pinned_at,
                    }}
                    groupId={groupId}
                    isDetail={true}
                />

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
                                                {comment.group_post_comment_images.length > 0 && (
                                                    <div
                                                        className={`grid gap-2 mt-3 ${comment.group_post_comment_images.length === 1
                                                            ? 'grid-cols-1'
                                                            : comment.group_post_comment_images.length === 2
                                                                ? 'grid-cols-2'
                                                                : comment.group_post_comment_images.length === 3
                                                                    ? 'grid-cols-3'
                                                                    : 'grid-cols-2'
                                                            }`}
                                                    >
                                                        {comment.group_post_comment_images.slice(0, 4).map((image: any, index: number) => (
                                                            <div
                                                                key={image.id}
                                                                className={`relative overflow-hidden rounded-lg border cursor-pointer ${comment.group_post_comment_images.length === 3 && index === 0
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
                                                                    className={`w-full object-cover transition-opacity duration-300 ${comment.group_post_comment_images.length === 1
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

                                                {/* コメントリアクション表示 */}
                                                <CommentReactions commentId={comment.id} onToggleReaction={(emoji, hasReacted) => handleToggleCommentReaction(comment.id, emoji, hasReacted)} />

                                                {/* コメントアクション */}
                                                <div className="flex items-center gap-4 mt-3">
                                                    <button
                                                        onClick={() => handleToggleCommentLike(comment.id, comment.is_liked)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 text-xs transition-colors p-1.5 rounded-full hover:bg-red-50",
                                                            comment.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                                                        )}
                                                    >
                                                        <Heart className={cn("h-4 w-4", comment.is_liked && "fill-current")} />
                                                        {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                                                    </button>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500">
                                                                <Smile className="h-4 w-4" />
                                                                <Plus className="h-3 w-3 -ml-0.5" />
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-fit p-2 flex gap-1 rounded-full border-blue-100 shadow-lg bg-white/90 backdrop-blur-sm" align="start">
                                                            {EMOJI_LIST.map((emoji) => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleToggleCommentReaction(comment.id, emoji, false)}
                                                                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-blue-50 rounded-full transition-colors active:scale-90"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* コメント入力フォーム - 固定表示（ナビゲーションバーの上に配置） */}
                    <CommentInputForm
                        onSubmit={handleCreateComment}
                        isLoading={createComment.isPending}
                    />
                </div>

                {/* 画像ビューアー */}
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

                {/* コメント編集ダイアログ */}
                <Dialog open={isEditCommentDialogOpen} onOpenChange={setIsEditCommentDialogOpen}>
                    <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-lg font-semibold text-blue-900">コメントを編集</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                            <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                placeholder="コメントを入力"
                                className="min-h-[100px] rounded-lg border-blue-100 resize-none text-blue-900"
                            />
                            <div className="text-sm text-blue-600">
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
                                className="flex-1 rounded-lg border-blue-100"
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={handleUpdateComment}
                                disabled={updateComment.isPending || !editingCommentContent.trim() || editingCommentContent.length > 500}
                                className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600"
                            >
                                {updateComment.isPending ? '更新中...' : '更新'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

// 別コンポーネントとしてリアクション表示を定義（再レンダリング最適化のため）
function CommentReactions({
    commentId,
    onToggleReaction
}: {
    commentId: string;
    onToggleReaction: (emoji: string, hasReacted: boolean) => void
}) {
    const { data: reactions = [] } = useGroupPostCommentReactions(commentId)

    if (reactions.length === 0) return null

    return (
        <div className="flex flex-wrap gap-1.5 mt-3">
            {reactions.map((group) => (
                <button
                    key={group.emoji}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleReaction(group.emoji, group.hasReacted)
                    }}
                    className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors border",
                        group.hasReacted
                            ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200"
                    )}
                >
                    <span>{group.emoji}</span>
                    <span>{group.count}</span>
                </button>
            ))}
        </div>
    )
}
