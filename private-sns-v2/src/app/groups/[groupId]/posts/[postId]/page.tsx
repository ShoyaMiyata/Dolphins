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
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TextWithUrlPreview } from '@/components/ui/text-with-url-preview'

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
                        comments_count: post.comments_count || 0,
                        likes_count: post.likes_count || 0,
                        reposts_count: 0,
                        is_liked: post.is_liked || false,
                        is_reposted: false,
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
