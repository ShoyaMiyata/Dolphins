'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AutoExpandTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number
  minHeight?: number
}

const AutoExpandTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandTextareaProps
>(({ className, onChange, maxHeight = 300, minHeight = 100, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [maxHeight, minHeight])

  React.useEffect(() => {
    adjustHeight()
  }, [adjustHeight, props.value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    onChange?.(e)
  }

  return (
    <motion.div
      className="relative"
      animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <textarea
        ref={(node) => {
          textareaRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={cn(
          'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none transition-all duration-200',
          isFocused && 'ring-2 ring-blue-500 border-blue-500',
          className
        )}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
        {...props}
      />

      {/* Gradient Border Effect */}
      {isFocused && (
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
            backgroundSize: '200% 200%',
            animation: 'gradient 3s ease infinite',
            padding: '2px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
          }}
        />
      )}
    </motion.div>
  )
})

AutoExpandTextarea.displayName = 'AutoExpandTextarea'

export { AutoExpandTextarea }
