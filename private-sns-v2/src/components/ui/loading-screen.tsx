'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-sky-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
        className="flex flex-col items-center gap-8"
      >
        {/* TOHKATSU Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-64 h-32"
        >
          <Image
            src="/images/logo-tohkatsu.png?v=2"
            alt="東葛 Dolphins"
            fill
            className="object-contain logo-blue-filter"
            priority
          />
        </motion.div>

        {/* Loading Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </motion.div>
    </div>
  )
}
