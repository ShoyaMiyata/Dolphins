'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editContent: string
  setEditContent: (value: string) => void
  editImagePreviews: string[]
  editImages: File[]
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  onSubmit: () => void
  isPending: boolean
}

export function EditPostDialog({
  open,
  onOpenChange,
  editContent,
  setEditContent,
  editImagePreviews,
  editImages,
  onImageSelect,
  onRemoveImage,
  onSubmit,
  isPending,
}: Props) {
  const inputId = 'edit-image-upload'
  const isDisabled =
    isPending || (!editContent.trim() && editImages.length === 0) || editContent.length > 500

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-5">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-semibold text-blue-900">投稿を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="投稿内容を入力"
            className="min-h-[150px] rounded-lg border-blue-100 resize-none text-blue-900"
          />
          <div className="text-sm text-blue-600">{editContent.length} / 500</div>

          {editImagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {editImagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={() => onRemoveImage(index)}
                    aria-label="画像を削除"
                  >
                    <span className="text-xs">×</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {editImages.length < 4 && (
            <div>
              <input
                type="file"
                id={inputId}
                accept="image/*"
                multiple
                onChange={onImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(inputId)?.click()}
                className="w-full"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                画像を追加 ({editImages.length}/4)
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg border-blue-100"
          >
            キャンセル
          </Button>
          <Button onClick={onSubmit} disabled={isDisabled} className="flex-1 rounded-lg">
            {isPending ? '更新中...' : '更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
