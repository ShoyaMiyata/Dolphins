'use client'

import { useParams } from 'next/navigation'
import { useUserProfileByUsername } from '@/hooks/use-user'
import { useUserPosts } from '@/hooks/use-posts'
import { ProfileHeader } from '@/components/features/profile-header'
import PostCard from '@/components/features/post-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function ProfilePage() {
  const params = useParams()
  const username = params?.username as string

  const { profile, isLoading: isLoadingProfile, error: profileError } = useUserProfileByUsername(username)
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(profile?.id || null)

  const { ref, inView } = useInView()

  // 無限スクロール
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ローディング状態
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <AppHeader groupName="プロフィール" />
        <main className="container max-w-md mx-auto pb-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </main>
      </div>
    )
  }

  // エラー状態
  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <AppHeader groupName="プロフィール" />
        <main className="container max-w-md mx-auto pb-4">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-2xl font-bold text-blue-900">ユーザーが見つかりません</h2>
            <p className="text-blue-600">@{username} は存在しないか、削除されました</p>
          </div>
        </main>
      </div>
    )
  }

  const allPosts = postsData?.pages.flatMap((page) => page.posts) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <AppHeader groupName="プロフィール" />

      {/* Main Content */}
      <main className="container max-w-md mx-auto pb-32 px-4">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-0">
          <TabsList className="w-full rounded-none border-b border-blue-100 bg-transparent">
            <TabsTrigger
              value="posts"
              className="flex-1 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-blue-700"
            >
              投稿
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex-1 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-blue-700"
              disabled
            >
              いいね
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : postsError ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-blue-600">投稿の読み込みに失敗しました</p>
              </div>
            ) : allPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-blue-600">まだ投稿がありません</p>
              </div>
            ) : (
              <>
                {allPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {/* 無限スクロールトリガー */}
                {hasNextPage && (
                  <div ref={ref} className="flex justify-center py-4">
                    {isFetchingNextPage ? (
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => fetchNextPage()}
                        disabled={!hasNextPage || isFetchingNextPage}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        もっと読み込む
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-blue-600">いいねした投稿は今後実装予定です</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
