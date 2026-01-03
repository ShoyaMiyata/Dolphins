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
import { PostCard } from '@/components/features/post-card'
import { CommentSearchResult } from '@/components/features/comment-search-result'
import { GroupPostSearchResult } from '@/components/features/group-post-search-result'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { data: userResults = [], isLoading: isLoadingUsers } = useSearchUsers(query)
  const { data: postResults = [], isLoading: isLoadingPosts } = useSearchPosts(query)
  const { data: commentResults = [], isLoading: isLoadingComments } = useSearchComments(query)
  const { data: groupPostResults = [], isLoading: isLoadingGroupPosts } = useSearchGroupPosts(query)

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

        {!query ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 mb-4">
              <SearchIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">検索</h2>
            <p className="text-gray-600">
              ユーザーや投稿を検索できます
            </p>
          </div>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="posts" className="flex items-center gap-1 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">投稿</span> ({postResults.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1 text-xs sm:text-sm">
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">コメント</span> ({commentResults.length})
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-1 text-xs sm:text-sm">
                <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">グループ</span> ({groupPostResults.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">ユーザー</span> ({userResults.length})
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

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-0">
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : postResults.length > 0 ? (
                <div className="space-y-4">
                  {postResults.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    投稿が見つかりませんでした
                  </h2>
                  <p className="text-gray-600">
                    別のキーワードで検索してみてください
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-0">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : commentResults.length > 0 ? (
                <div className="space-y-3">
                  {commentResults.map((comment) => (
                    <CommentSearchResult key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <MessageCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    コメントが見つかりませんでした
                  </h2>
                  <p className="text-gray-600">
                    別のキーワードで検索してみてください
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Group Posts Tab */}
            <TabsContent value="groups" className="mt-0">
              {isLoadingGroupPosts ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : groupPostResults.length > 0 ? (
                <div className="space-y-3">
                  {groupPostResults.map((post) => (
                    <GroupPostSearchResult key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <UsersIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    グループ投稿が見つかりませんでした
                  </h2>
                  <p className="text-gray-600">
                    別のキーワードで検索してみてください
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
