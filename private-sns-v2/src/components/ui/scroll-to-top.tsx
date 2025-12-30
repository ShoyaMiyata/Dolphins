'use client'

import * as React from 'react'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollToTopProps {
  showAfter?: number
  smooth?: boolean
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

const positionClasses = {
  'bottom-right': 'bottom-24 right-6',
  'bottom-left': 'bottom-24 left-6',
  'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
}

export function ScrollToTop({
  showAfter = 400,
  smooth = true,
  className,
  position = 'bottom-right',
}: ScrollToTopProps) {
  const [show, setShow] = React.useState(false)
  const { scrollY } = useScroll()

  React.useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setShow(latest > showAfter)
    })

    return () => unsubscribe()
  }, [scrollY, showAfter])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
          onClick={scrollToTop}
          className={cn(
            'fixed z-40 p-3 rounded-full bg-blue-600 text-white shadow-2xl hover:shadow-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-shadow duration-300',
            positionClasses[position],
            className
          )}
          aria-label="トップに戻る"
        >
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.div>

          {/* Pulse Ring Effect */}
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

interface ScrollProgressProps {
  className?: string
  color?: string
}

export function ScrollProgress({
  className,
  color = 'bg-blue-600',
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className={cn('fixed top-0 left-0 right-0 h-1 origin-left z-50', color, className)}
      style={{ scaleX: scrollYProgress }}
    />
  )
}
