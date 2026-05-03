'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Props {
  imageUrl: string | null
  onClose: () => void
}

export function ImageViewer({ imageUrl, onClose }: Props) {
  return (
    <Dialog open={imageUrl !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        <img
          src={imageUrl || ''}
          alt="投稿画像"
          className="w-full h-auto max-h-[90vh] object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}
