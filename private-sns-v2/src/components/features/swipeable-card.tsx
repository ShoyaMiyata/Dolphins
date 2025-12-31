'use client'

import { useMemo } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
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
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void
  isActive?: boolean
}

const GRADIENTS = [
  'from-blue-400 via-blue-500 to-blue-600',
  'from-purple-400 via-purple-500 to-purple-600',
  'from-pink-400 via-pink-500 to-pink-600',
  'from-orange-400 via-orange-500 to-orange-600',
  'from-teal-400 via-teal-500 to-teal-600',
  'from-indigo-400 via-indigo-500 to-indigo-600',
  'from-cyan-400 via-cyan-500 to-cyan-600',
]

export function SwipeableCard({ hangout, onSwipe, isActive = false }: SwipeableCardProps) {
  const x = useMotionValue(0)
  // X移動量に応じて回転させる (-200pxで-20度, 200pxで20度)
  const rotate = useTransform(x, [-200, 200], [-20, 20])

  const randomGradient = useMemo(() => {
    const hash = hangout.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return GRADIENTS[hash % GRADIENTS.length]
  }, [hangout.id])

  const handleDragEnd = (_: any, info: PanInfo) => {
    // アクティブじゃないカードからのイベントは無視
    if (!isActive) return;

    const offsetThreshold = 100; // 距離判定
    const velocityThreshold = 500; // 速度判定

    const isRight = info.offset.x > offsetThreshold || (info.offset.x > 20 && info.velocity.x > velocityThreshold);
    const isLeft = info.offset.x < -offsetThreshold || (info.offset.x < -20 && info.velocity.x < -velocityThreshold);

    if (isRight) {
      onSwipe('right');
    } else if (isLeft) {
      onSwipe('left');
    }
  };

  const dateObj = new Date(hangout.date)
  const formattedDate = format(dateObj, 'M月d日(E)', { locale: ja })

  return (
    <motion.div
      style={{
        x,
        rotate,
        width: '100%',
        height: '100%',
        cursor: isActive ? 'grab' : 'default',
        background: '#fff',
        borderRadius: '24px',        // 角丸を大きく
        overflow: 'hidden',          // 【重要】中身のはみ出しを防止
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', // 影をリッチに
        position: 'absolute',        // 位置固定
        touchAction: 'none',
      }}
      className="rounded-[24px] overflow-hidden" // Tailwindでも角丸を適用
      // 【重要】アクティブな場合のみドラッグ有効
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
    >
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
            <p className="whitespace-pre-wrap line-clamp-2">
              {hangout.description}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
