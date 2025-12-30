'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
}

export function CircularProgress({
  value,
  max,
  size = 40,
  strokeWidth = 3,
  className,
  showValue = false,
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return '#ef4444' // red
    if (percentage >= 90) return '#f59e0b' // yellow/orange
    return '#3b82f6' // blue
  }

  const color = getColor()

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Value Display */}
      {showValue && (
        <motion.span
          className="absolute text-xs font-semibold"
          style={{ color }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value > max ? '+' : ''}{Math.abs(value - max)}
        </motion.span>
      )}
    </div>
  )
}
