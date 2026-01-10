'use client'

import Image from 'next/image'
import { useSplashScreen } from '@/hooks/use-splash-screen'

export function SplashScreen() {
  const { isVisible, isExiting } = useSplashScreen(2000, 500)

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      <Image
        src="/images/Sprash.png"
        alt="Splash Screen"
        fill
        priority
        className="object-cover"
      />
    </div>
  )
}
