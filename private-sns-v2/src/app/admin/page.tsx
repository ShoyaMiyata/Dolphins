'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Shield,
  Clock,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle
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
  const { data: stats } = useAdminStats()

  const updateUserRole = useUpdateUserRole()
  const updateLastAccess = useUpdateLastAccess()
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

  const handleUpdateLastAccess = async (userId: string) => {
    await updateLastAccess.mutateAsync(userId)
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
            <Card>
              <CardHeader>
                <CardTitle>ユーザー管理</CardTitle>
                <CardDescription>
                  ユーザーの権限変更や最終アクセス時刻の確認ができます
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name?.[0] || user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{user.display_name || user.username}</p>
                              {user.role === 'admin' && (
                                <Badge variant="destructive" className="text-xs">管理者</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>投稿: {user.posts || 0}</span>
                              <span>コメント: {user.comments || 0}</span>
                              <span>フォロワー: {user.followers || 0}</span>
                              <span>最終アクセス: {user.last_access_at ? format(new Date(user.last_access_at), 'yyyy/MM/dd HH:mm', { locale: ja }) : '未記録'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">ユーザー</SelectItem>
                              <SelectItem value="admin">管理者</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateLastAccess(user.id)}
                            disabled={updateLastAccess.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
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
            <Card>
              <CardHeader>
                <CardTitle>改善要望管理</CardTitle>
                <CardDescription>
                  ユーザーの改善要望を確認し、ステータスを管理できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacksLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    改善要望はありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback: any) => (
                      <div key={feedback.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={feedback.profiles?.avatar_url} />
                              <AvatarFallback>
                                {feedback.profiles?.display_name?.[0] || feedback.profiles?.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">
                                {feedback.profiles?.display_name || feedback.profiles?.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(feedback.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(feedback.status)}`}>
                              {getStatusIcon(feedback.status)}
                              <span className="ml-1">{getStatusText(feedback.status)}</span>
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                          {feedback.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <Select
                            value={feedback.status}
                            onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'declined') =>
                              handleFeedbackStatusChange(feedback.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">保留中</SelectItem>
                              <SelectItem value="in_progress">対応中</SelectItem>
                              <SelectItem value="completed">完了</SelectItem>
                              <SelectItem value="declined">却下</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedbackId(feedback.id)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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
