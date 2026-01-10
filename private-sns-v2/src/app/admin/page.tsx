'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  User
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdmin } from '@/hooks/use-admin'
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateLastAccess,
  useAdminFeedback,
  useUpdateFeedbackStatus,
  useDeleteFeedback,
  useAdminStats
} from '@/hooks/use-admin-management'

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, isUser } = useAdmin()

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: users = [], isLoading: usersLoading } = useAdminUsers()
  const { data: feedbacks = [], isLoading: feedbacksLoading } = useAdminFeedback()
  const { data: stats, isLoading: statsLoading } = useAdminStats()

  const updateUserRole = useUpdateUserRole()
  const updateFeedbackStatus = useUpdateFeedbackStatus()
  const deleteFeedback = useDeleteFeedback()

  // Redirect if not admin
  if (!isUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセスが拒否されました</h1>
          <p className="text-gray-600">このページにアクセスするにはログインが必要です。</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセスが拒否されました</h1>
          <p className="text-gray-600">このページにアクセスするには管理者権限が必要です。</p>
        </div>
      </div>
    )
  }

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    await updateUserRole.mutateAsync({ userId, role: newRole })
  }


  const handleFeedbackStatusChange = async (feedbackId: string, status: 'pending' | 'in_progress' | 'completed' | 'declined') => {
    await updateFeedbackStatus.mutateAsync({ feedbackId, status })
  }

  const handleDeleteFeedback = async () => {
    if (selectedFeedbackId) {
      await deleteFeedback.mutateAsync(selectedFeedbackId)
      setShowDeleteDialog(false)
      setSelectedFeedbackId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '保留中'
      case 'in_progress':
        return '対応中'
      case 'completed':
        return '完了'
      case 'declined':
        return '却下'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">管理者パネル</h1>
          </div>
          <p className="text-gray-600">
            ユーザー管理、フィードバック管理、システム統計を確認できます
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総投稿数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総コメント数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">改善要望数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalFeedbacks || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">ユーザー管理</TabsTrigger>
            <TabsTrigger value="feedback">改善要望管理</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-2xl border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">ユーザー管理</CardTitle>
                    <CardDescription className="text-blue-700">
                      ユーザーの権限管理とアクセス状況を管理できます
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Global Update Last Access Button */}
                <div className="mb-6 flex justify-center">
                  <Button
                    onClick={handleUpdateLastAccess}
                    disabled={updateLastAccess.isPending}
                    className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    {updateLastAccess.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>全ユーザーのアクセス時刻を更新中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>全ユーザーのアクセス時刻を更新</span>
                      </div>
                    )}
                  </Button>
                </div>

                {usersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span>読み込み中...</span>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-gray-400">
                      <Users className="h-8 w-8" />
                      <div>
                        <p className="text-lg font-medium">ユーザーが見つかりません</p>
                        <p className="text-sm">システムに登録されているユーザーがいません</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user: any, index: number) => (
                      <div
                        key={user.id}
                        className="bg-gradient-to-r from-white to-blue-50/30 rounded-xl p-5 border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                      >
                        {/* Mobile Layout */}
                        <div className="block md:hidden space-y-4">
                          {/* User Info Row */}
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-sm">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-400 to-sky-400 text-white font-bold text-base">
                                  {user.display_name?.[0] || user.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              {user.role === 'admin' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                  <Shield className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                  {user.display_name || user.username}
                                </h3>
                                {user.role === 'admin' && (
                                  <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 shadow-sm px-2 py-0.5 text-xs">
                                    <Shield className="h-2.5 w-2.5 mr-1" />
                                    管理者
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                @{user.username}
                              </p>
                            </div>
                          </div>

                          {/* Access Info */}
                          <div className="bg-white/60 rounded-lg p-3 border border-blue-50">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                <span className="font-medium">最終アクセス</span>
                              </div>
                              <div className={`text-sm font-semibold ${user.last_access_at ? 'text-green-600' : 'text-gray-500'}`}>
                                {user.last_access_at
                                  ? format(new Date(user.last_access_at), 'yyyy/MM/dd HH:mm', { locale: ja })
                                  : '未記録'
                                }
                              </div>
                            </div>
                            {user.last_access_at && (
                              <div className="text-xs text-gray-500 mt-1 pl-0">
                                ({formatDistanceToNow(new Date(user.last_access_at), { addSuffix: true, locale: ja })})
                              </div>
                            )}
                          </div>

                          {/* Role Management */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              権限
                            </label>
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(value: 'user' | 'admin') =>
                                handleRoleChange(user.id, value)
                              }
                            >
                              <SelectTrigger className={`w-full ${user.role === 'admin'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-blue-200">
                                <SelectItem value="user" className="hover:bg-blue-50 focus:bg-blue-50">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span>ユーザー</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin" className="hover:bg-orange-50 focus:bg-orange-50">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-orange-500" />
                                    <span>管理者</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Avatar with Role Indicator */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-14 w-14 ring-3 ring-blue-100 shadow-sm">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-400 to-sky-400 text-white font-bold text-lg">
                                  {(user.display_name || user.username || '').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {/* Role Badge Overlay */}
                              {user.role === 'admin' && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                  <Shield className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 truncate">
                                  {user.display_name || user.username}
                                </h3>
                                {user.role === 'admin' && (
                                  <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 shadow-sm px-3 py-1">
                                    <Shield className="h-3 w-3 mr-1" />
                                    管理者
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                                <span className="text-gray-400">@</span>
                                {user.username}
                              </p>

                              {/* Access Info */}
                              <div className="bg-white/60 rounded-lg p-3 border border-blue-50">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 text-blue-500" />
                                  <span className="text-gray-700 font-medium">最終アクセス:</span>
                                  <span className={`font-semibold ${user.last_access_at
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                                    }`}>
                                    {user.last_access_at
                                      ? format(new Date(user.last_access_at), 'yyyy/MM/dd HH:mm', { locale: ja })
                                      : '未記録'
                                    }
                                  </span>
                                  {user.last_access_at && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({formatDistanceToNow(new Date(user.last_access_at), { addSuffix: true, locale: ja })})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Role Management */}
                          <div className="flex flex-col gap-2 ml-4">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              権限
                            </label>
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(value: 'user' | 'admin') =>
                                handleRoleChange(user.id, value)
                              }
                            >
                              <SelectTrigger className={`w-32 ${user.role === 'admin'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-blue-200">
                                <SelectItem value="user" className="hover:bg-blue-50 focus:bg-blue-50">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span>ユーザー</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin" className="hover:bg-orange-50 focus:bg-orange-50">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-orange-500" />
                                    <span>管理者</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-2xl border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">改善要望管理</CardTitle>
                    <CardDescription className="text-blue-700">
                      ユーザーの改善要望を確認し、ステータスを管理できます
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {feedbacksLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span>読み込み中...</span>
                    </div>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-gray-400">
                      <MessageSquare className="h-8 w-8" />
                      <div>
                        <p className="text-lg font-medium">改善要望はありません</p>
                        <p className="text-sm">新しい改善要望が届くとここに表示されます</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback: any, index: number) => (
                      <div
                        key={feedback.id}
                        className="bg-gradient-to-r from-white to-blue-50/30 rounded-xl p-5 border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                              <AvatarFallback className="bg-gradient-to-r from-blue-400 to-sky-400 text-white font-medium">
                                U
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                ユーザーID: {feedback.user_id.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(feedback.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs px-3 py-1 rounded-full ${getStatusColor(feedback.status)} border-0 shadow-sm`}>
                              {getStatusIcon(feedback.status)}
                              <span className="ml-1 font-medium">{getStatusText(feedback.status)}</span>
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-white/70 rounded-lg p-4 mb-4 border border-blue-50">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {feedback.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <Select
                            value={feedback.status}
                            onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'declined') =>
                              handleFeedbackStatusChange(feedback.id, value)
                            }
                          >
                            <SelectTrigger className="w-36 bg-white border-blue-200 hover:border-blue-300 focus:border-blue-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-blue-200">
                              <SelectItem value="pending" className="hover:bg-yellow-50 focus:bg-yellow-50">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span>保留中</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress" className="hover:bg-blue-50 focus:bg-blue-50">
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="h-4 w-4 text-blue-500" />
                                  <span>対応中</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="completed" className="hover:bg-green-50 focus:bg-green-50">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>完了</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="declined" className="hover:bg-red-50 focus:bg-red-50">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span>却下</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedbackId(feedback.id)
                              setShowDeleteDialog(true)
                            }}
                            className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 focus:bg-red-100 focus:border-red-300 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Feedback Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>改善要望を削除しますか？</DialogTitle>
              <DialogDescription>
                この操作は取り消せません。改善要望が完全に削除されます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleDeleteFeedback} className="bg-red-500 hover:bg-red-600">
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
