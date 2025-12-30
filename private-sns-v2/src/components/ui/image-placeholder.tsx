'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageWithPlaceholderProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
}

export function ImageWithPlaceholder({
  src,
  alt,
  className,
  aspectRatio = 'square',
}: ImageWithPlaceholderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Placeholder */}
      {(isLoading || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <ImageIcon className="w-8 h-8 text-gray-300" />
        </div>
      )}

      {/* Actual image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  )
}
