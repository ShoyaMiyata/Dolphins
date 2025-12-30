'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  onClose?: () => void
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: 'bg-blue-50 border-blue-500 text-blue-900',
    iconClassName: 'text-blue-600',
    progressClassName: 'bg-gradient-to-r from-blue-500 to-sky-500',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-500 text-red-900',
    iconClassName: 'text-red-600',
    progressClassName: 'bg-red-500',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-amber-50 border-amber-500 text-amber-900',
    iconClassName: 'text-amber-600',
    progressClassName: 'bg-amber-500',
  },
  info: {
    icon: Info,
    className: 'bg-sky-50 border-sky-500 text-sky-900',
    iconClassName: 'text-sky-600',
    progressClassName: 'bg-gradient-to-r from-sky-400 to-blue-400',
  },
}

export function Toast({
  id,
  title,
  description,
  variant = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [progress, setProgress] = React.useState(100)
  const config = variantConfig[variant]
  const Icon = config.icon

  React.useEffect(() => {
    if (duration === Infinity) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        clearInterval(interval)
        onClose?.()
      }
    }, 16)

    return () => clearInterval(interval)
  }, [duration, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className={cn(
        'relative w-full max-w-md rounded-lg border-l-4 shadow-lg backdrop-blur-sm overflow-hidden',
        config.className
      )}
    >
      {/* Progress Bar */}
      {duration !== Infinity && (
        <motion.div
          className={cn('absolute top-0 left-0 h-1', config.progressClassName)}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.016, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5', config.iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">{title}</h4>
          {description && (
            <p className="mt-1 text-sm opacity-90 leading-snug">{description}</p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastProps[]
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4',
}

export function ToastContainer({ toasts, position = 'top-right' }: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Hook
interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    ({ title, description, variant = 'info', duration = 5000 }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9)

      const newToast: ToastProps = {
        id,
        title,
        description,
        variant,
        duration,
        onClose: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        },
      }

      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  return { toasts, toast }
}
