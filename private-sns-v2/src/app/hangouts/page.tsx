'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Calendar, Trash2, Edit, X, Check, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SwipeableCard } from '@/components/features/swipeable-card'
import { CreateHangoutDialog } from '@/components/features/create-hangout-dialog'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AppHeader } from '@/components/layout/app-header'
import { usePendingHangouts, useRespondedHangouts, useMyHangouts, useRespondToHangout, useDeleteHangout, useUpdateHangout } from '@/hooks/use-hangouts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function HangoutsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hangoutToDelete, setHangoutToDelete] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [hangoutToEdit, setHangoutToEdit] = useState<any | null>(null)

  const user = useAuthStore((state) => state.user)
  const { data: pendingHangouts = [], isLoading: isLoadingPending } = usePendingHangouts()
  const { data: respondedHangouts = [], isLoading: isLoadingResponded } = useRespondedHangouts()
  const { data: myHangouts = [], isLoading: isLoadingMy } = useMyHangouts()
  const respondToHangout = useRespondToHangout()
  const deleteHangout = useDeleteHangout()
  const updateHangout = useUpdateHangout()

  // デバッグ用ログ
  console.log('pendingHangouts:', pendingHangouts)
  console.log('isLoadingPending:', isLoadingPending)
  console.log('respondedHangouts:', respondedHangouts)
  console.log('isLoadingResponded:', isLoadingResponded)
  console.log('myHangouts:', myHangouts)
  console.log('isLoadingMy:', isLoadingMy)

  const handleSwipe = useCallback(async (hangoutId: string, response: 'yes' | 'no' | 'maybe') => {
    try {
      console.log('handleSwipe: Starting response for', hangoutId, 'with', response)
      await respondToHangout.mutateAsync({ hangoutId, response })
      console.log('handleSwipe: Response saved, moving to next card')
      setCurrentCardIndex((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to respond:', error)
      // エラーが発生してもカードを進める（ユーザーが再度操作できるように）
      setCurrentCardIndex((prev) => prev + 1)
    }
  }, [respondToHangout])

  const handleSkip = (hangoutId: string) => {
    // スキップ: 回答を保存せず次のカードに進む
    setCurrentCardIndex((prev) => prev + 1)
  }

  const handleDeleteClick = (hangoutId: string) => {
    setHangoutToDelete(hangoutId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (hangoutToDelete) {
      try {
        console.log('Deleting hangout:', hangoutToDelete)
        await deleteHangout.mutateAsync(hangoutToDelete)
        console.log('Delete successful')
        setDeleteDialogOpen(false)
        setHangoutToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
        alert(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleEditClick = (hangout: any) => {
    setHangoutToEdit(hangout)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hangoutToEdit) return

    const formData = new FormData(e.target as HTMLFormElement)
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      location: formData.get('location') as string || null,
      date: formData.get('date') as string || null,
      time: formData.get('time') as string || null,
    }

    await updateHangout.mutateAsync({ hangoutId: hangoutToEdit.id, data })
    setEditDialogOpen(false)
    setHangoutToEdit(null)
  }

  const currentHangouts = pendingHangouts.slice(currentCardIndex)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4 pb-32">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">回答する</span>
              <span className="sm:hidden">回答</span>
            </TabsTrigger>
            <TabsTrigger value="responded" className="flex items-center gap-1 text-xs sm:text-sm">
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">回答済み</span>
              <span className="sm:hidden">済</span>
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-1 text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">自分の予定</span>
              <span className="sm:hidden">予定</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Hangouts - Swipe Interface */}
          <TabsContent value="pending" className="mt-0 overflow-hidden">
            <div className="relative h-[calc(100vh-280px)] flex flex-col overflow-hidden">
              {isLoadingPending ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : currentHangouts.length > 0 ? (
                <>
                  <div className="relative flex-1 pb-32 overflow-hidden">
                    {(currentHangouts.slice(0, 3) as any[]).map((hangout, index) => (
                      <motion.div
                        key={hangout.id}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          zIndex: currentHangouts.length - index,
                        }}
                        initial={index === 0 ? { scale: 1, opacity: 1 } : { scale: 1 - index * 0.05, opacity: 1, y: index * 10 }}
                        animate={{ scale: 1 - index * 0.05, opacity: 1, y: index * 10 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      >
                        {index === 0 && (
                          <SwipeableCard hangout={hangout} onSwipe={handleSwipe} onSkip={handleSkip} />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons with remaining count */}
                  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20">
                    {/* Remaining count above buttons */}
                    {currentHangouts.length > 1 && (
                      <div className="text-center mb-3">
                        <span className="text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-full shadow-md inline-block">
                          残り {currentHangouts.length - 1} 件
                        </span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSwipe((currentHangouts[0] as any).id, 'no')}
                        className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-red-200 hover:border-red-400 transition-colors"
                      >
                        <X className="w-8 h-8 text-red-500" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSwipe((currentHangouts[0] as any).id, 'maybe')}
                        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-yellow-200 hover:border-yellow-400 transition-colors"
                      >
                        <Calendar className="w-6 h-6 text-yellow-500" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSwipe((currentHangouts[0] as any).id, 'yes')}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-xl flex items-center justify-center hover:from-green-500 hover:to-green-700 transition-all"
                      >
                        <Check className="w-8 h-8 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <Users className="h-12 w-12 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    全ての予定に回答しました！
                  </h3>
                  <p className="text-gray-500 text-center">
                    新しい誘いが来るのを待つか、
                    <br />
                    自分で予定を作成してみましょう
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Responded Hangouts */}
          <TabsContent value="responded" className="mt-0">
            <div className="space-y-4">
              {isLoadingResponded ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : respondedHangouts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-500">回答済みの予定はありません</p>
                </div>
              ) : (
                respondedHangouts.map((hangout: any) => {
                  const dateObj = new Date(hangout.date)
                  const formattedDate = format(dateObj, 'M月d日(E)', { locale: ja })
                  const responseColors = {
                    yes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    no: 'bg-rose-100 text-rose-800 border-rose-300',
                    maybe: 'bg-amber-100 text-amber-800 border-amber-300',
                  }
                  const responseLabels = {
                    yes: 'YES',
                    no: 'NO',
                    maybe: '別の日なら',
                  }
                  const responseIcons = {
                    yes: '●', // 丸
                    no: '✕', // バツ
                    maybe: '△', // 三角
                  }
                  return (
                    <Card key={hangout.id} className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={hangout.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {hangout.profiles?.display_name?.[0] || hangout.profiles?.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-blue-900">{hangout.profiles?.display_name || hangout.profiles?.username}</p>
                                <p className="text-sm text-gray-500">@{hangout.profiles?.username}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-2 rounded-full text-lg border flex items-center justify-center ${responseColors[hangout.my_response as keyof typeof responseColors]}`}>
                                  {responseIcons[hangout.my_response as keyof typeof responseIcons]}
                                </span>
                                {/* Response change button for participants */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                                  onClick={() => handleSwipe(hangout.id, hangout.my_response === 'yes' ? 'no' : hangout.my_response === 'no' ? 'maybe' : 'yes')}
                                  title="回答を変更"
                                >
                                  変更
                                </Button>
                                {/* Edit button for hangout creator - plans content */}
                                {/* Creator can edit the hangout content */}
                                {hangout.user_id === user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleEditClick(hangout)}
                                    title="予定の内容を編集"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <h3 className="font-bold text-lg mt-2 text-blue-900">{hangout.title}</h3>
                            {hangout.description && (
                              <p className="text-sm text-gray-600 mt-1">{hangout.description}</p>
                            )}
                            <div className="flex flex-col gap-1 mt-3 text-sm text-gray-700">
                              {hangout.date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                  <span>{formattedDate} {hangout.time && hangout.time}</span>
                                </div>
                              )}
                              {hangout.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                  <span>{hangout.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* My Hangouts */}
          <TabsContent value="my" className="mt-0">
            <div className="space-y-4">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                新しい予定を作成
              </Button>

              {isLoadingMy ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : myHangouts.length > 0 ? (
                <div className="space-y-4">
                  {myHangouts.map((hangout: any) => {
                    const yesCount = hangout.hangout_responses.filter(
                      (r: any) => r.response === 'yes'
                    ).length
                    const noCount = hangout.hangout_responses.filter(
                      (r: any) => r.response === 'no'
                    ).length
                    const maybeCount = hangout.hangout_responses.filter(
                      (r: any) => r.response === 'maybe'
                    ).length

                    const dateObj = new Date(hangout.date)
                    const formattedDate = format(dateObj, 'M月d日(E)', { locale: ja })

                    return (
                      <motion.div
                        key={hangout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden"
                      >
                        {hangout.image_url && (
                          <div className="relative h-32 bg-gradient-to-br from-blue-100 to-sky-100">
                            <img
                              src={hangout.image_url}
                              alt={hangout.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex-1">
                              {hangout.title}
                            </h3>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditClick(hangout)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteClick(hangout.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-blue-600 mb-3">
                            {formattedDate}
                            {hangout.time && ` ${hangout.time}`}
                          </p>

                          {hangout.location && (
                            <p className="text-sm text-gray-600 mb-3">{hangout.location}</p>
                          )}

                          {/* Response Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-gray-700">
                                いけます: <strong>{yesCount}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-gray-700">
                                別の日: <strong>{maybeCount}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-gray-700">
                                NO: <strong>{noCount}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Who responded - Detailed View */}
                          {hangout.hangout_responses.length > 0 && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <p className="text-sm font-semibold text-gray-700 mb-3">
                                回答者 ({hangout.hangout_responses.length}人)
                              </p>

                              {/* Yes Responses */}
                              {hangout.hangout_responses.filter((r: any) => r.response === 'yes').length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <p className="text-xs font-semibold text-green-700">YES</p>
                                  </div>
                                  <div className="pl-4 space-y-2">
                                    {hangout.hangout_responses
                                      .filter((r: any) => r.response === 'yes')
                                      .map((response: any) => (
                                        <div key={response.id} className="flex items-center gap-2">
                                          <Avatar className="h-7 w-7">
                                            <AvatarImage src={response.profiles.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                              {response.profiles.display_name?.[0] || response.profiles.username[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                              {response.profiles.display_name || response.profiles.username}
                                            </p>
                                            <p className="text-xs text-gray-500">@{response.profiles.username}</p>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Maybe Responses */}
                              {hangout.hangout_responses.filter((r: any) => r.response === 'maybe').length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <p className="text-xs font-semibold text-yellow-700">別の日なら</p>
                                  </div>
                                  <div className="pl-4 space-y-2">
                                    {hangout.hangout_responses
                                      .filter((r: any) => r.response === 'maybe')
                                      .map((response: any) => (
                                        <div key={response.id} className="flex items-center gap-2">
                                          <Avatar className="h-7 w-7">
                                            <AvatarImage src={response.profiles.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                                              {response.profiles.display_name?.[0] || response.profiles.username[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                              {response.profiles.display_name || response.profiles.username}
                                            </p>
                                            <p className="text-xs text-gray-500">@{response.profiles.username}</p>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* No Responses */}
                              {hangout.hangout_responses.filter((r: any) => r.response === 'no').length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <p className="text-xs font-semibold text-red-700">NO</p>
                                  </div>
                                  <div className="pl-4 space-y-2">
                                    {hangout.hangout_responses
                                      .filter((r: any) => r.response === 'no')
                                      .map((response: any) => (
                                        <div key={response.id} className="flex items-center gap-2">
                                          <Avatar className="h-7 w-7">
                                            <AvatarImage src={response.profiles.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs bg-red-100 text-red-700">
                                              {response.profiles.display_name?.[0] || response.profiles.username[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                              {response.profiles.display_name || response.profiles.username}
                                            </p>
                                            <p className="text-xs text-gray-500">@{response.profiles.username}</p>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <Calendar className="h-12 w-12 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    まだ予定がありません
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    みんなを誘って遊びの予定を作ってみましょう！
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Create Hangout Dialog */}
      <CreateHangoutDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-blue-900">予定を削除しますか？</DialogTitle>
            <DialogDescription className="text-sm text-blue-700">
              この操作は取り消せません。予定と関連する画像が完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 rounded-lg border-blue-100"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteHangout.isPending}
              className="flex-1 rounded-lg"
            >
              {deleteHangout.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hangout Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold text-blue-900">予定を編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-sm font-semibold">
                何する？ *
              </Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={hangoutToEdit?.title || ''}
                placeholder="バスケしよう！ / ご飯行こう！"
                className="rounded-lg border-blue-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-date" className="text-sm font-semibold">いつ？</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  defaultValue={hangoutToEdit?.date || ''}
                  className="text-sm rounded-lg border-blue-100"
                />
                <Input
                  id="edit-time"
                  name="time"
                  type="time"
                  defaultValue={hangoutToEdit?.time || ''}
                  className="text-sm rounded-lg border-blue-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location" className="text-sm font-semibold">
                どこで？
              </Label>
              <Input
                id="edit-location"
                name="location"
                defaultValue={hangoutToEdit?.location || ''}
                placeholder="学校の体育館 / 駅前のカフェ"
                className="rounded-lg border-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm font-semibold">
                メモ
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={hangoutToEdit?.description || ''}
                placeholder="補足があれば自由に記入..."
                rows={2}
                className="resize-none rounded-lg border-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateHangout.isPending}
                className="px-5"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={updateHangout.isPending}
                className="bg-blue-500 hover:bg-blue-600 px-6"
              >
                {updateHangout.isPending ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
