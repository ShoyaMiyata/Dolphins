'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search as SearchIcon, Users, FileText, MessageCircle, UsersIcon } from 'lucide-react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AppHeader } from '@/components/layout/app-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchUsers, useSearchPosts, useSearchComments, useSearchGroupPosts } from '@/hooks/use-search'
import PostCard from '@/components/features/post-card'
import { CommentSearchResult } from '@/components/features/comment-search-result'
import { GroupPostSearchResult } from '@/components/features/group-post-search-result'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { data: userResults = [], isLoading: isLoadingUsers } = useSearchUsers(query)
  const { data: postResults = [], isLoading: isLoadingPosts } = useSearchPosts(query)
  const { data: commentResults = [], isLoading: isLoadingComments } = useSearchComments(query)
  const { data: groupPostResults = [], isLoading: isLoadingGroupPosts } = useSearchGroupPosts(query)

  // 投稿・コメント・グループ投稿を統合
  const isLoadingContent = isLoadingPosts || isLoadingComments || isLoadingGroupPosts
  const totalContentCount = postResults.length + commentResults.length + groupPostResults.length

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <AppHeader />

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="ユーザーや投稿を検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 border-blue-100 focus:border-blue-300"
          />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              ユーザー ({userResults.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              投稿・コメント ({totalContentCount})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            {isLoadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : userResults.length > 0 ? (
              <div className="space-y-3">
                {userResults.map((user) => (
                  <Link key={user.id} href={`/profile/${user.username}`}>
                    <Card className="p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer bg-white border-blue-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-sky-400 text-white font-semibold">
                            {user.display_name?.[0] || user.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {user.display_name || user.username}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      {user.bio && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ユーザーが見つかりませんでした
                </h2>
                <p className="text-gray-600">
                  別のキーワードで検索してみてください
                </p>
              </div>
            )}
          </TabsContent>

          {/* Content Tab (Posts, Comments, Group Posts) */}
          <TabsContent value="content" className="mt-0">
            {!query ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 mb-4">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">投稿・コメントを検索</h2>
                <p className="text-gray-600">
                  キーワードを入力して投稿やコメントを検索できます
                </p>
              </div>
            ) : isLoadingContent ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : totalContentCount > 0 ? (
              <div className="space-y-4">
                {/* Group Posts */}
                {groupPostResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 px-1">
                      {query ? `グループ投稿 (${groupPostResults.length})` : `参加中のグループの投稿 (${groupPostResults.length})`}
                    </h3>
                    {groupPostResults.map((post) => (
                      <GroupPostSearchResult key={post.id} post={post} />
                    ))}
                  </div>
                )}

                {/* Posts */}
                {postResults.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 px-1">投稿 ({postResults.length})</h3>
                    {postResults.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}

                {/* Comments */}
                {commentResults.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 px-1">コメント ({commentResults.length})</h3>
                    {commentResults.map((comment) => (
                      <CommentSearchResult key={comment.id} comment={comment} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  投稿・コメントが見つかりませんでした
                </h2>
                <p className="text-gray-600">
                  別のキーワードで検索してみてください
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  )
}
