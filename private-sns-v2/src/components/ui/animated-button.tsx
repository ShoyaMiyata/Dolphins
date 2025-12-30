'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const animatedButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95',
        destructive:
          'bg-red-600 text-white shadow-md hover:bg-red-700 active:scale-95',
        outline:
          'border-2 border-blue-600 bg-transparent text-blue-600 shadow-sm hover:bg-blue-50 active:scale-95',
        secondary:
          'bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 active:scale-95',
        ghost: 'hover:bg-blue-50 hover:text-blue-600 active:scale-95',
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof animatedButtonVariants> {
  children?: React.ReactNode
  loading?: boolean
  withRipple?: boolean
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      withRipple = true,
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<
      Array<{ x: number; y: number; id: number }>
    >([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (withRipple && !disabled && !loading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const newRipple = { x, y, id: Date.now() }
        setRipples((prev) => [...prev, newRipple])

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
        }, 600)
      }

      if (onClick && !disabled && !loading) {
        onClick(e)
      }
    }

    return (
      <motion.button
        ref={ref}
        className={cn(animatedButtonVariants({ variant, size, className }))}
        onClick={handleClick}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {/* Ripple Effect */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
            }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{
              width: 400,
              height: 400,
              opacity: 0,
              x: -200,
              y: -200,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* Loading Spinner */}
        {loading && <Loader2 className="animate-spin" />}

        {/* Children */}
        {!loading && children}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export { AnimatedButton, animatedButtonVariants }
