'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onClick?: () => void
  icon?: React.ReactNode
  label?: string
  className?: string
  show?: boolean
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
  show = true,
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'fixed bottom-20 right-6 z-40 rounded-full bg-blue-600 text-white shadow-2xl hover:shadow-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-shadow duration-300',
            label && isHovered ? 'px-6 py-4' : 'p-4',
            className
          )}
          aria-label={label || 'アクション'}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isHovered ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>

            <AnimatePresence>
              {label && isHovered && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Pulse Effect */}
          <motion.span
            className="absolute inset-0 rounded-full bg-blue-600"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
