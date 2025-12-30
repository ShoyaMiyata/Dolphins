'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCreatePostDialog } from '@/hooks/use-create-post-dialog'
import { PostForm } from './post-form'

export function CreatePostDialog() {
  const { isOpen, close } = useCreatePostDialog()

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">新しい投稿</DialogTitle>
        </DialogHeader>
        <PostForm onSuccess={close} />
      </DialogContent>
    </Dialog>
  )
}
