'use client'

import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface CommentInputFormProps {
    onSubmit: (content: string, images?: File[]) => Promise<void>
    isLoading: boolean
    placeholder?: string
}

export function CommentInputForm({
    onSubmit,
    isLoading,
    placeholder = 'コメントを入力...',
}: CommentInputFormProps) {
    const [content, setContent] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    // 画像選択処理
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newFiles = Array.from(files).slice(0, 4 - images.length)

        // プレビュー作成
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

        setImages([...images, ...newFiles])
        setImagePreviews([...imagePreviews, ...newPreviews])
    }

    // 画像削除処理
    const handleImageRemove = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index])
        setImages(images.filter((_, i) => i !== index))
        setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    }

    // 送信処理
    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) return

        await onSubmit(content, images.length > 0 ? images : undefined)

        // リセット
        setContent('')
        setImages([])
        imagePreviews.forEach(URL.revokeObjectURL)
        setImagePreviews([])
    }

    return (
        <Card className="fixed bottom-20 left-0 right-0 bg-white rounded-t-xl shadow-lg border-t border-blue-100 p-4 z-40">
            <div className="container max-w-2xl mx-auto">
                <div className="flex gap-3">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[60px] max-h-[120px] resize-none rounded-lg border-blue-100"
                    />
                    <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                                disabled={images.length >= 4}
                            />
                            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                                <ImageIcon className="h-4 w-4 text-blue-500" />
                            </div>
                        </label>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || (!content.trim() && images.length === 0)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {isLoading ? '送信中...' : '送信'}
                        </Button>
                    </div>
                </div>

                {/* 画像プレビュー */}
                {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={preview}
                                    alt={`プレビュー ${index + 1}`}
                                    className="h-16 w-16 object-cover rounded-lg border"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleImageRemove(index)}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    )
}
