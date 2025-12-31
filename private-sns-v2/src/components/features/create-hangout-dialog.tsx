'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageIcon, X, Loader2, Calendar, MapPin, Clock, Users, Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCreateHangout } from '@/hooks/use-hangouts'
import { createClient } from '@/lib/supabase/client'

const hangoutSchema = z.object({
  title: z.string().min(1, '内容を入力してください'),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
})

type HangoutFormData = z.infer<typeof hangoutSchema>

interface CreateHangoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateHangoutDialog({ open, onOpenChange }: CreateHangoutDialogProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [visibilityType, setVisibilityType] = useState<'all' | 'selected'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // マイグレーション実行済みフラグ（実行後にtrueに変更）
  const VISIBILITY_FEATURE_ENABLED = true

  const createHangout = useCreateHangout()

  // ユーザー一覧を取得
  useEffect(() => {
    const fetchUsers = async () => {
      if (!VISIBILITY_FEATURE_ENABLED) return

      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (session?.session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .neq('id', session.session.user.id)

        if (data) {
          setUsers(data)
        }
      }
    }

    if (open) {
      fetchUsers()
    }
  }, [open, VISIBILITY_FEATURE_ENABLED])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HangoutFormData>({
    resolver: zodResolver(hangoutSchema),
    defaultValues: {
      date: '',
      time: '',
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const onSubmit = async (data: HangoutFormData) => {
    try {
      setIsUploading(true)

      let imageUrl: string | null = null

      // 画像がある場合はアップロード
      if (selectedImage) {
        const supabase = createClient()
        const { data: session } = await supabase.auth.getSession()

        if (session?.session?.user) {
          const fileExt = selectedImage.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `hangouts/${session.session.user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, selectedImage)

          if (uploadError) {
            console.error('Upload error:', uploadError)
          } else {
            const { data: urlData } = supabase.storage
              .from('images')
              .getPublicUrl(filePath)
            imageUrl = urlData.publicUrl
          }
        }
      }

      const hangoutData: any = {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        date: data.date || null,
        time: data.time || null,
        image_url: imageUrl,
      }

      // マイグレーション実行後にのみvisibility_typeを追加
      if (VISIBILITY_FEATURE_ENABLED && visibilityType) {
        hangoutData.visibility_type = visibilityType
      }

      await createHangout.mutateAsync({
        hangout: hangoutData,
        selectedUsers: VISIBILITY_FEATURE_ENABLED && visibilityType === 'selected' ? selectedUsers : undefined,
      })

      reset()
      setSelectedImage(null)
      setImagePreview(null)
      setVisibilityType('all')
      setSelectedUsers([])
      onOpenChange(false)
    } catch (error) {
      console.error('Create hangout error:', error)
      alert(`予定の作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-5">
        <VisuallyHidden>
          <DialogTitle>遊びの予定を作成</DialogTitle>
          <DialogDescription>
            遊びの予定の詳細を入力してください
          </DialogDescription>
        </VisuallyHidden>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-semibold">
              何する？ *
            </Label>
            <Input
              id="title"
              placeholder="バスケしよう！ / ご飯行こう！"
              {...register('title')}
              className="rounded-lg border-blue-100"
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="flex items-center gap-1.5 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-blue-500" />
              いつ？
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="date"
                type="date"
                {...register('date')}
                className="text-sm rounded-lg border-blue-100"
              />
              <Input
                id="time"
                type="time"
                {...register('time')}
                className="text-sm rounded-lg border-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500">※ 未定の場合は空欄でOK</p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-blue-500" />
              どこで？
            </Label>
            <Input
              id="location"
              placeholder="学校の体育館 / 駅前のカフェ"
              {...register('location')}
              className="rounded-lg border-blue-100"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-semibold">
              メモ
            </Label>
            <Textarea
              id="description"
              placeholder="補足があれば自由に記入..."
              rows={2}
              {...register('description')}
              className="resize-none rounded-lg border-blue-100"
            />
          </div>

          {/* Visibility Type */}
          {VISIBILITY_FEATURE_ENABLED && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <Users className="h-4 w-4 text-blue-500" />
                公開範囲
              </Label>
              <RadioGroup value={visibilityType} onValueChange={(value: 'all' | 'selected') => setVisibilityType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="visibility-all" />
                  <Label htmlFor="visibility-all" className="font-normal cursor-pointer">
                    全員に公開
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="visibility-selected" />
                  <Label htmlFor="visibility-selected" className="font-normal cursor-pointer">
                    選択したユーザーのみ
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* User Selection (only shown when visibility is 'selected') */}
          {VISIBILITY_FEATURE_ENABLED && visibilityType === 'selected' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                公開するユーザーを選択
              </Label>
              <div className="max-h-40 overflow-y-auto border border-blue-100 rounded-lg p-2 space-y-2">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">ユーザーが見つかりません</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedUsers((prev) =>
                          prev.includes(user.id)
                            ? prev.filter((id) => id !== user.id)
                            : [...prev, user.id]
                        )
                      }}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers((prev) => [...prev, user.id])
                          } else {
                            setSelectedUsers((prev) => prev.filter((id) => id !== user.id))
                          }
                        }}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.display_name?.[0] || user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-blue-600">
                  {selectedUsers.length}人のユーザーが選択されています
                </p>
              )}
            </div>
          )}

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">画像</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {imagePreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-blue-100">
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg border-blue-100 hover:bg-blue-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 mr-2 text-blue-500" />
                画像を追加
              </Button>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading || createHangout.isPending}
              className="px-5"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isUploading || createHangout.isPending}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              {isUploading || createHangout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
