'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { postSchema, type PostFormData } from '@/validations/post'
import { useCreatePost } from '@/hooks/use-posts'
import { useCreateGroupPost } from '@/hooks/use-group-posts'
import { Button } from '@/components/ui/button'
import { AutoExpandTextarea } from '@/components/ui/auto-expand-textarea'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageIcon, X, Loader2, Crop } from 'lucide-react'
import Cropper, { Area } from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'

interface PostFormProps {
  onSuccess?: () => void
  groupId?: string
}

export function PostForm({ onSuccess, groupId }: PostFormProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<{
    display_name?: string | null
    avatar_url?: string | null
    username?: string
  } | null>(null)
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createPost = useCreatePost()
  const createGroupPost = useCreateGroupPost()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  })

  const content = watch('content')
  const contentLength = content?.length || 0

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (session?.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, username')
          .eq('id', session.session.user.id)
          .single()

        if (profile) {
          setCurrentUser(profile)
        }
      }
    }

    fetchUser()
  }, [])

  // 画像選択処理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 最大5枚まで
    const remainingSlots = 5 - selectedImages.length
    const filesToAdd = files.slice(0, remainingSlots)

    setSelectedImages((prev) => [...prev, ...filesToAdd])

    // プレビュー作成
    filesToAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    // inputをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 画像削除
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // トリミング完了
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  // トリミング適用
  const applyCrop = async () => {
    if (cropImageIndex === null || !croppedAreaPixels) return

    try {
      const image = await createImage(imagePreviews[cropImageIndex])
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )

      canvas.toBlob((blob) => {
        if (!blob) return

        const file = new File([blob], selectedImages[cropImageIndex].name, {
          type: 'image/jpeg',
        })

        const newImages = [...selectedImages]
        newImages[cropImageIndex] = file

        setSelectedImages(newImages)

        // プレビュー更新
        const reader = new FileReader()
        reader.onloadend = () => {
          const newPreviews = [...imagePreviews]
          newPreviews[cropImageIndex] = reader.result as string
          setImagePreviews(newPreviews)
        }
        reader.readAsDataURL(file)

        setCropImageIndex(null)
      }, 'image/jpeg')
    } catch (error) {
      console.error('トリミングエラー:', error)
    }
  }

  // 投稿処理
  const onSubmit = async (data: PostFormData) => {
    if (!data.content && selectedImages.length === 0) {
      return
    }

    if (groupId) {
      // グループ投稿
      await createGroupPost.mutateAsync({
        groupId,
        content: data.content,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      })
    } else {
      // 通常投稿
      await createPost.mutateAsync({
        content: data.content,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      })
    }

    // フォームリセット
    reset()
    setSelectedImages([])
    setImagePreviews([])

    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-none shadow-none">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-blue-100">
                  <AvatarImage src={currentUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-sky-400 text-white font-semibold">
                    {currentUser?.display_name?.[0] || currentUser?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <AutoExpandTextarea
                    {...register('content')}
                    placeholder="今何してる？"
                    minHeight={80}
                    maxHeight={300}
                    className="border-none p-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none bg-transparent"
                  />

                <AnimatePresence>
                  {errors.content && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500"
                    >
                      {errors.content.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* 画像プレビュー */}
                <AnimatePresence mode="popLayout">
                  {imagePreviews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 gap-2 md:grid-cols-3"
                    >
                      {imagePreviews.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group relative aspect-square overflow-hidden rounded-lg"
                        >
                          <img
                            src={preview}
                            alt={`プレビュー ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50"
                          >
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => setCropImageIndex(index)}
                              >
                                <Crop className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleRemoveImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={selectedImages.length >= 5}
                    />
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={selectedImages.length >= 5}
                        className="h-9 px-3 text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </motion.div>

                    {/* 文字数カウント - Circular Progress */}
                    <AnimatePresence>
                      {contentLength > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="ml-2"
                        >
                          <CircularProgress
                            value={contentLength}
                            max={500}
                            size={32}
                            strokeWidth={3}
                            showValue={contentLength > 450}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      disabled={
                        (groupId ? createGroupPost.isPending : createPost.isPending) ||
                        (!content?.trim() && selectedImages.length === 0) ||
                        contentLength > 500
                      }
                      className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md disabled:opacity-50"
                    >
                      {(groupId ? createGroupPost.isPending : createPost.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          投稿中...
                        </>
                      ) : (
                        '投稿'
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      </motion.div>

      {/* 画像トリミングダイアログ */}
      <Dialog open={cropImageIndex !== null} onOpenChange={() => setCropImageIndex(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>画像をトリミング</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full">
            {cropImageIndex !== null && (
              <Cropper
                image={imagePreviews[cropImageIndex]}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ズーム</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCropImageIndex(null)}>
                キャンセル
              </Button>
              <Button onClick={applyCrop}>適用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// 画像読み込みヘルパー
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}
