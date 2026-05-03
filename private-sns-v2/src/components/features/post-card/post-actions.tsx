'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Heart, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  commentsCount: number
  repostsCount: number
  likesCount: number
  isLiked: boolean
  isReposted: boolean
  isMutating: boolean
  onComment: () => void
  onRepost: () => void
  onLike: () => void
  rightSlot?: React.ReactNode
}

export function PostActions({
  commentsCount,
  repostsCount,
  likesCount,
  isLiked,
  isReposted,
  isMutating,
  onComment,
  onRepost,
  onLike,
  rightSlot,
}: Props) {
  return (
    <div className="flex items-center gap-1 pt-2 -ml-2">
      <ActionButton
        icon={<MessageCircle className="h-4 w-4" />}
        count={commentsCount}
        onClick={onComment}
        ariaLabel={`コメント ${commentsCount}件`}
        hoverColor="blue"
      />
      <ActionButton
        icon={<Repeat2 className="h-4 w-4" />}
        count={repostsCount}
        active={isReposted}
        onClick={onRepost}
        ariaLabel={isReposted ? 'リポストを解除' : 'リポスト'}
        disabled={isMutating}
        hoverColor="green"
      />
      <ActionButton
        icon={<Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />}
        count={likesCount}
        active={isLiked}
        onClick={onLike}
        ariaLabel={isLiked ? 'いいねを解除' : 'いいね'}
        disabled={isMutating}
        hoverColor="red"
        animateActive
      />
      <div className="flex-1" />
      {rightSlot}
    </div>
  )
}

interface ActionButtonProps {
  icon: React.ReactNode
  count: number
  active?: boolean
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
  hoverColor: 'blue' | 'green' | 'red'
  animateActive?: boolean
}

const colorMap = {
  blue: { active: 'text-blue-500', hover: 'hover:text-blue-500 hover:bg-blue-50' },
  green: { active: 'text-green-500', hover: 'hover:text-green-500 hover:bg-green-50' },
  red: { active: 'text-red-500', hover: 'hover:text-red-500 hover:bg-red-50' },
}

function ActionButton({
  icon,
  count,
  active,
  onClick,
  ariaLabel,
  disabled,
  hoverColor,
  animateActive,
}: ActionButtonProps) {
  const c = colorMap[hoverColor]
  return (
    <motion.div whileTap={{ scale: 0.92 }}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={ariaLabel}
        aria-pressed={active}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        disabled={disabled}
        className={`h-8 gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
          active ? c.active : 'text-gray-500'
        } ${c.hover}`}
      >
        <motion.span
          animate={animateActive && active ? { scale: [1, 1.25, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.span>
        {count > 0 && (
          <span className="text-xs font-medium tabular-nums">{count}</span>
        )}
      </Button>
    </motion.div>
  )
}
