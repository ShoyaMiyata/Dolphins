'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Check, X, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface SwipeableCardProps {
  hangout: {
    id: string
    user_id: string
    title: string
    description: string | null
    location: string | null
    date: string
    time: string | null
    image_url: string | null
    profiles: {
      display_name: string | null
      username: string
      avatar_url: string | null
    }
  }
  onSwipe: (hangoutId: string, response: 'yes' | 'no' | 'maybe') => void
}

export function SwipeableCard({ hangout, onSwipe }: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  // Swipe indicators
  const yesOpacity = useTransform(x, [0, 150], [0, 1])
  const noOpacity = useTransform(x, [-150, 0], [1, 0])
  const maybeScale = useTransform(x, [-50, 0, 50], [1, 1.2, 1])

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false)

    // 右スワイプ - YES (行ける)
    if (info.offset.x > 100) {
      setExitX(500)
      onSwipe(hangout.id, 'yes')
    }
    // 左スワイプ - NO (行けない)
    else if (info.offset.x < -100) {
      setExitX(-500)
      onSwipe(hangout.id, 'no')
    }
    // 上スワイプ - MAYBE (別の日なら)
    else if (info.offset.y < -100) {
      setExitX(0)
      onSwipe(hangout.id, 'maybe')
    }
  }

  const dateObj = new Date(hangout.date)
  const formattedDate = format(dateObj, 'M月d日(E)', { locale: ja })

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        cursor: 'grab',
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX, opacity: 0 } : {}}
      transition={{ duration: 0.3 }}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute w-full"
    >
      <Card className="overflow-hidden border-2 border-blue-200 shadow-2xl">
        {/* Swipe Indicators */}
        {isDragging && (
          <>
            {/* YES Indicator - Right */}
            <motion.div
              style={{ opacity: yesOpacity }}
              className="absolute top-8 right-8 z-10 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg rotate-12"
            >
              <div className="flex items-center gap-2">
                <Check className="h-6 w-6" />
                <span>行ける！</span>
              </div>
            </motion.div>

            {/* NO Indicator - Left */}
            <motion.div
              style={{ opacity: noOpacity }}
              className="absolute top-8 left-8 z-10 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg -rotate-12"
            >
              <div className="flex items-center gap-2">
                <X className="h-6 w-6" />
                <span>行けない</span>
              </div>
            </motion.div>

            {/* MAYBE Indicator - Center */}
            <motion.div
              style={{ scale: maybeScale }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-yellow-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>別の日なら</span>
              </div>
            </motion.div>
          </>
        )}

        {/* Image */}
        {hangout.image_url && (
          <div className="relative h-48 bg-gradient-to-br from-blue-100 to-sky-100">
            <img
              src={hangout.image_url}
              alt={hangout.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={hangout.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {hangout.profiles.display_name?.[0] || hangout.profiles.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">
                {hangout.profiles.display_name || hangout.profiles.username}
              </p>
              <p className="text-sm text-gray-500">@{hangout.profiles.username}</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{hangout.title}</h2>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-blue-600 mb-3">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">
              {formattedDate}
              {hangout.time && ` ${hangout.time}`}
            </span>
          </div>

          {/* Location */}
          {hangout.location && (
            <p className="text-gray-700 mb-3">
              <span className="font-semibold">場所:</span> {hangout.location}
            </p>
          )}

          {/* Description */}
          {hangout.description && (
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{hangout.description}</p>
          )}

          {/* Swipe Instructions */}
          <div className="border-t pt-4 mt-4">
            <p className="text-center text-sm text-gray-500 mb-2">スワイプして回答</p>
            <div className="flex justify-around text-xs">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-gray-600">左: 行けない</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-gray-600">上: 別の日</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-gray-600">右: 行ける</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
