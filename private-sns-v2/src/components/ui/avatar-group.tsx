'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarItem {
  id: string
  name: string
  avatarUrl?: string | null
  online?: boolean
}

interface AvatarGroupProps {
  avatars: AvatarItem[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onAvatarClick?: (avatar: AvatarItem) => void
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const indicatorSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className,
  onAvatarClick,
}: AvatarGroupProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const displayedAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)

  return (
    <div className={cn('flex items-center', className)}>
      {displayedAvatars.map((avatar, index) => (
        <motion.div
          key={avatar.id}
          className="relative cursor-pointer"
          style={{
            zIndex: hoveredIndex === index ? 10 : displayedAvatars.length - index,
            marginLeft: index === 0 ? 0 : '-0.5rem',
          }}
          initial={{ x: 0 }}
          animate={{
            x: hoveredIndex !== null && hoveredIndex <= index ? 8 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onAvatarClick?.(avatar)}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
          >
            <Avatar
              className={cn(
                sizeClasses[size],
                'ring-2 ring-white transition-shadow',
                hoveredIndex === index && 'ring-4 ring-blue-400'
              )}
            >
              <AvatarImage src={avatar.avatarUrl || undefined} alt={avatar.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-semibold">
                {avatar.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Online Indicator */}
            {avatar.online && (
              <motion.span
                className={cn(
                  'absolute bottom-0 right-0 rounded-full bg-green-500 ring-2 ring-white',
                  indicatorSizes[size]
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                }}
              />
            )}
          </motion.div>

          {/* Tooltip on Hover */}
          {hoveredIndex === index && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: -5 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none shadow-lg"
            >
              {avatar.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Remaining Count */}
      {remainingCount > 0 && (
        <motion.div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-gray-700 font-semibold text-xs cursor-pointer',
            sizeClasses[size]
          )}
          style={{
            marginLeft: '-0.5rem',
            zIndex: 0,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  )
}

interface AvatarWithStatusProps {
  name: string
  avatarUrl?: string | null
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export function AvatarWithStatus({
  name,
  avatarUrl,
  online = false,
  size = 'md',
  showTooltip = false,
  className,
}: AvatarWithStatusProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Online Indicator */}
      {online && (
        <motion.span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-green-500 ring-2 ring-white',
            indicatorSizes[size]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: -5 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none shadow-lg z-50"
        >
          {name}
          {online && ' • オンライン'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </motion.div>
      )}
    </div>
  )
}
