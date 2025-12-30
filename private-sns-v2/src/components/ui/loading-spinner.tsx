'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  variant?: 'dots' | 'ring' | 'pulse' | 'bars'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

const dotSizes = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
}

export function LoadingSpinner({
  variant = 'ring',
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn('rounded-full bg-blue-600', dotSizes[size])}
            animate={{
              y: ['0%', '-100%', '0%'],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <motion.div
          className={cn('rounded-full bg-blue-600', sizeClasses[size])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className={cn('absolute rounded-full bg-blue-400', sizeClasses[size])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    )
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className={cn('w-1 bg-blue-600 rounded-full', {
              'h-4': size === 'sm',
              'h-8': size === 'md',
              'h-12': size === 'lg',
            })}
            animate={{
              scaleY: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    )
  }

  // Default: ring variant
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-blue-200"
        style={{ borderTopColor: '#2563eb' }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}

interface LoadingOverlayProps {
  show: boolean
  message?: string
  variant?: 'dots' | 'ring' | 'pulse' | 'bars'
}

export function LoadingOverlay({
  show,
  message = '読み込み中...',
  variant = 'ring',
}: LoadingOverlayProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4"
      >
        <LoadingSpinner variant={variant} size="lg" />
        {message && (
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        )}
      </motion.div>
    </motion.div>
  )
}
