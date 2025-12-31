'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useGroup } from '@/hooks/use-groups'
import { useGroupPosts } from '@/hooks/use-group-posts'
import { AppHeader } from '@/components/layout/app-header'
import { PostForm } from '@/components/features/post-form'
import { PostCard } from '@/components/features/post-card'
import { PostSkeleton } from '@/components/features/post-skeleton'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.groupId as string

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId)
  const { data: posts, isLoading: isPostsLoading } = useGroupPosts(groupId)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
      {/* Header with Group Name */}
      <AppHeader groupName={group.name} />

      {/* Main Content */}
      <main className="container max-w-md mx-auto pb-32 px-4">
        {/* Post Form (Members Only) */}
        {isMember && (
          <div className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 mt-4 hover:shadow-lg transition-shadow">
            <PostForm groupId={groupId} />
          </div>
        )}

        {/* Non-member message */}
        {!isMember && (
          <Card className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 mt-4 p-6 text-center">
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
                    ...post,
                    post_images: post.group_post_images.map((img: any) => ({
                      id: img.id,
                      image_url: img.image_url,
                      order_index: img.order_index,
                      post_id: post.id,
                      created_at: img.created_at,
                    })),
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
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
