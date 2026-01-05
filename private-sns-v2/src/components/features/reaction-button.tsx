'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useReactions,
  useCommentReactions,
  useAddReaction,
  useRemoveReaction,
  ReactionGroup,
} from '@/hooks/use-reactions'
import {
  useCustomStamps,
  useCreateCustomStamp,
} from '@/hooks/use-custom-stamps'

interface ReactionButtonProps {
  targetId: string
  isComment?: boolean
  className?: string
  preventNavigation?: boolean
}

export function ReactionButton({ targetId, isComment = false, className }: ReactionButtonProps) {
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)

  const { data: reactions = [] } = isComment
    ? useCommentReactions(targetId)
    : useReactions(targetId)

  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()
  const { data: customStamps = [] } = useCustomStamps()
  const createCustomStamp = useCreateCustomStamp()

  // リアクション処理
  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji)

    try {
      if (existingReaction?.hasReacted) {
        // 既にリアクションしている場合は削除
        await removeReaction.mutateAsync({
          postId: isComment ? undefined : targetId,
          commentId: isComment ? targetId : undefined,
          emoji,
        })
      } else {
        // リアクションを追加
        await addReaction.mutateAsync({
          postId: isComment ? undefined : targetId,
          commentId: isComment ? targetId : undefined,
          emoji,
        })
      }
    } catch (error) {
      console.error('リアクション処理エラー:', error)
    } finally {
      // 即座に閉じる
      setIsReactionPickerOpen(false)
    }
  }

  return (
    <>
      {/* リアクションボタン */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className={`h-8 gap-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 px-2 py-1 rounded-full transition-colors ${className}`}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg" align="start">
            {/* 絵文字ピッカー */}
            <div className="mb-4">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  handleReaction(emojiData.emoji)
                }}
                width="100%"
                height={300}
                searchDisabled={true}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </div>

            {/* カスタムスタンプセクション */}
            {customStamps.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">カスタムスタンプ</h4>
                <div className="grid grid-cols-4 gap-2">
                  {customStamps.slice(0, 8).map((stamp) => (
                    <Button
                      key={stamp.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(stamp.image_url)}
                      className="h-12 p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <img
                        src={stamp.image_url}
                        alt={stamp.name || 'カスタムスタンプ'}
                        className="w-full h-full object-cover rounded"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* カスタムスタンプ作成ボタン */}
            <div className="border-t pt-3 mt-3">
              <input
                type="file"
                id={`custom-stamp-input-${targetId}`}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    createCustomStamp.mutate({ image: file })
                    e.target.value = ''
                  }
                }}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`custom-stamp-input-${targetId}`)?.click()}
                disabled={createCustomStamp.isPending}
                className="w-full text-sm"
              >
                {createCustomStamp.isPending ? '作成中...' : '+ カスタムスタンプ追加'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* リアクション表示 */}
      {reactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1 mt-2"
        >
          {reactions.map((reaction: ReactionGroup) => {
            // カスタムスタンプかどうか判定（URLかどうか）
            const isCustomStamp = reaction.emoji.startsWith('http')

            return (
              <Button
                key={reaction.emoji}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReaction(reaction.emoji)
                  setIsReactionPickerOpen(false) // ワンタッチで閉じる
                }}
                className={`h-6 px-2 py-1 rounded-full text-xs gap-1 transition-colors ${reaction.hasReacted
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {isCustomStamp ? (
                  <img
                    src={reaction.emoji}
                    alt="カスタムスタンプ"
                    className="w-3 h-3 object-cover rounded"
                  />
                ) : (
                  <span className="text-sm">{reaction.emoji}</span>
                )}
                <span className="text-xs font-medium">{reaction.count}</span>
              </Button>
            )
          })}
        </motion.div>
      )}
    </>
  )
}
