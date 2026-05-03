'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  comment: string
  setComment: (value: string) => void
  onConfirm: () => void
  isPending: boolean
}

export function RepostDialog({
  open,
  onOpenChange,
  comment,
  setComment,
  onConfirm,
  isPending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md rounded-2xl border border-blue-100 bg-white p-5">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-semibold text-blue-900">リポスト</DialogTitle>
          <DialogDescription className="text-sm text-blue-700">
            リポストにコメントを追加できます（オプション）
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメントを追加（任意）"
            className="min-h-[100px] rounded-lg border-blue-100 resize-none text-blue-900"
          />
          <div className="text-sm text-blue-600">{comment.length} / 500</div>
        </div>
        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setComment('')
            }}
            className="flex-1 rounded-lg border-blue-100"
          >
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || comment.length > 500}
            className="flex-1 rounded-lg bg-green-500 hover:bg-green-600"
          >
            {isPending ? 'リポスト中...' : 'リポスト'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
