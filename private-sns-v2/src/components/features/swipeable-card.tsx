'use client'

import { useState, useMemo } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from 'framer-motion'
import { Check, X, Calendar, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
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
  onSkip: (hangoutId: string) => void
}

const SWIPE_THRESHOLD = 100
const SWIPE_VELOCITY = 500

const GRADIENTS = [
  'from-blue-400 via-blue-500 to-blue-600',
  'from-purple-400 via-purple-500 to-purple-600',
  'from-pink-400 via-pink-500 to-pink-600',
  'from-orange-400 via-orange-500 to-orange-600',
  'from-teal-400 via-teal-500 to-teal-600',
  'from-indigo-400 via-indigo-500 to-indigo-600',
  'from-cyan-400 via-cyan-500 to-cyan-600',
]

export function SwipeableCard({ hangout, onSwipe, onSkip }: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0)
  const [exitY, setExitY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const controls = useAnimation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  const opacity = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [0.5, 1, 1, 1, 0.5]
  )

  const yesOpacity = useTransform(x, [0, 150], [0, 0.3])
  const noOpacity = useTransform(x, [-150, 0], [0.3, 0])
  const maybeOpacity = useTransform(y, [-150, 0], [0.3, 0])

  const randomGradient = useMemo(() => {
    const hash = hangout.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return GRADIENTS[hash % GRADIENTS.length]
  }, [hangout.id])

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false)

    const swipeVelocity = Math.abs(info.velocity.x) > SWIPE_VELOCITY || Math.abs(info.velocity.y) > SWIPE_VELOCITY
    const swipeDistance = Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.offset.y) > SWIPE_THRESHOLD

    if (swipeVelocity || swipeDistance) {
      // 上スワイプ: maybe
      if (Math.abs(info.offset.y) > Math.abs(info.offset.x) && info.offset.y < -50) {
        setExitY(-1000)
        setTimeout(() => onSwipe(hangout.id, 'maybe'), 100)
      }
      // 下スワイプ: skip (保留)
      else if (Math.abs(info.offset.y) > Math.abs(info.offset.x) && info.offset.y > 50) {
        setExitY(1000)
        setTimeout(() => onSkip(hangout.id), 100)
      }
      // 右スワイプ: yes
      else if (info.offset.x > 50) {
        setExitX(1000)
        setTimeout(() => onSwipe(hangout.id, 'yes'), 100)
      }
      // 左スワイプ: no
      else if (info.offset.x < -50) {
        setExitX(-1000)
        setTimeout(() => onSwipe(hangout.id, 'no'), 100)
      } else {
        controls.start({ x: 0, y: 0, rotate: 0 })
      }
    } else {
      controls.start({ x: 0, y: 0, rotate: 0 })
    }
  }

  const dateObj = new Date(hangout.date)
  const formattedDate = format(dateObj, 'M月d日(E)', { locale: ja })

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
        cursor: 'grab',
      }}
      drag
      dragElastic={1}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={
        exitX !== 0 || exitY !== 0
          ? {
              x: exitX,
              y: exitY,
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.3, ease: 'easeOut' }
            }
          : controls
      }
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      whileTap={{ cursor: 'grabbing', scale: 0.95 }}
      className="absolute w-full touch-none h-full"
    >
      <Card className="relative overflow-hidden border-none shadow-2xl h-full rounded-3xl">
        {/* Background Image or Gradient */}
        <div className="absolute inset-0">
          {hangout.image_url ? (
            <img
              src={hangout.image_url}
              alt={hangout.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${randomGradient}`} />
          )}
        </div>

        {/* Swipe Color Overlays */}
        <motion.div
          style={{ opacity: yesOpacity }}
          className="absolute inset-0 bg-green-500 pointer-events-none"
        />
        <motion.div
          style={{ opacity: noOpacity }}
          className="absolute inset-0 bg-red-500 pointer-events-none"
        />
        <motion.div
          style={{ opacity: maybeOpacity }}
          className="absolute inset-0 bg-yellow-500 pointer-events-none"
        />

        {/* Swipe Indicators */}
        <>
          {/* YES Indicator - Right */}
          <motion.div
            style={{ opacity: yesOpacity }}
            className="absolute top-8 right-8 z-10 bg-white text-green-600 px-6 py-3 rounded-full font-bold text-xl shadow-lg rotate-12"
          >
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6" />
              <span>行ける！</span>
            </div>
          </motion.div>

          {/* NO Indicator - Left */}
          <motion.div
            style={{ opacity: noOpacity }}
            className="absolute top-8 left-8 z-10 bg-white text-red-600 px-6 py-3 rounded-full font-bold text-xl shadow-lg -rotate-12"
          >
            <div className="flex items-center gap-2">
              <X className="h-6 w-6" />
              <span>行けない</span>
            </div>
          </motion.div>

          {/* MAYBE Indicator - Top Center */}
          <motion.div
            style={{ opacity: maybeOpacity }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white text-yellow-600 px-6 py-3 rounded-full font-bold text-xl shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              <span>別の日なら</span>
            </div>
          </motion.div>
        </>

        {/* Information Box at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/98 to-transparent rounded-t-3xl p-6 shadow-2xl">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
              <AvatarImage src={hangout.profiles.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                {hangout.profiles.display_name?.[0] || hangout.profiles.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {hangout.profiles.display_name || hangout.profiles.username}
              </p>
              <p className="text-sm text-gray-500">@{hangout.profiles.username}</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{hangout.title}</h2>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold text-lg">
              {formattedDate}
              {hangout.time && ` ${hangout.time}`}
            </span>
          </div>

          {/* Location */}
          {hangout.location && (
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">{hangout.location}</span>
            </div>
          )}

          {/* Description */}
          {hangout.description && (
            <div className="text-gray-600">
              <p className={`whitespace-pre-wrap ${!showFullDescription && 'line-clamp-2'}`}>
                {hangout.description}
              </p>
              {hangout.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm mt-1"
                >
                  {showFullDescription ? '閉じる' : '...もっと見る'}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
