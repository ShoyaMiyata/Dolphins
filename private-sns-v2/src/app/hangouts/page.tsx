'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Calendar, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SwipeableCard } from '@/components/features/swipeable-card'
import { CreateHangoutDialog } from '@/components/features/create-hangout-dialog'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AppHeader } from '@/components/layout/app-header'
import { usePendingHangouts, useMyHangouts, useRespondToHangout, useDeleteHangout, useUpdateHangout } from '@/hooks/use-hangouts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
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

  const { data: pendingHangouts = [], isLoading: isLoadingPending } = usePendingHangouts()
  const { data: myHangouts = [], isLoading: isLoadingMy } = useMyHangouts()
  const respondToHangout = useRespondToHangout()
  const deleteHangout = useDeleteHangout()
  const updateHangout = useUpdateHangout()

  const handleSwipe = async (hangoutId: string, response: 'yes' | 'no' | 'maybe') => {
    await respondToHangout.mutateAsync({ hangoutId, response })
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
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              回答する
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              自分の予定
            </TabsTrigger>
          </TabsList>

          {/* Pending Hangouts - Swipe Interface */}
          <TabsContent value="pending" className="mt-0">
            <div className="relative min-h-[600px]">
              {isLoadingPending ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : currentHangouts.length > 0 ? (
                <div className="relative">
                  <AnimatePresence>
                    {currentHangouts.slice(0, 3).map((hangout, index) => (
                      <motion.div
                        key={hangout.id}
                        style={{
                          zIndex: currentHangouts.length - index,
                          scale: 1 - index * 0.05,
                        }}
                        initial={{ scale: 1 - index * 0.05, opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {index === 0 && (
                          <SwipeableCard hangout={hangout} onSwipe={handleSwipe} />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Remaining count */}
                  {currentHangouts.length > 1 && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                      残り {currentHangouts.length - 1} 件
                    </div>
                  )}
                </div>
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
                                行ける: <strong>{yesCount}</strong>
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
                                行けない: <strong>{noCount}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Who responded */}
                          {hangout.hangout_responses.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-2">回答済み</p>
                              <div className="flex flex-wrap gap-2">
                                {hangout.hangout_responses.map((response: any) => (
                                  <div
                                    key={response.id}
                                    className="flex items-center gap-1"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={response.profiles.avatar_url || undefined}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {response.profiles.display_name?.[0] ||
                                          response.profiles.username[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">
                                      {response.response === 'yes'
                                        ? '✓'
                                        : response.response === 'no'
                                        ? '✗'
                                        : '?'}
                                    </span>
                                  </div>
                                ))}
                              </div>
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
              <Label className="text-sm font-semibold">いつ？</Label>
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
