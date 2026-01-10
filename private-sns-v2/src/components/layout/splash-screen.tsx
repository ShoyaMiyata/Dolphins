'use client'

import Image from 'next/image'
import { useSplashScreen } from '@/hooks/use-splash-screen'

export function SplashScreen() {
    const { isVisible, isExiting } = useSplashScreen(2000, 500)

    if (!isVisible) return null

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600 transition-opacity duration-500 ease-in-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            <div className="relative animate-bounce-subtle">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse" />

                <Image
                    src="/images/Dolphins-logo.png"
                    alt="Dolphins Logo"
                    width={180}
                    height={180}
                    priority
                    className="relative z-10 drop-shadow-2xl"
                />
            </div>

            <div className={`mt-8 flex flex-col items-center gap-2 transition-all duration-700 delay-300 ${isExiting ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <h1 className="text-3xl font-bold tracking-tighter text-white drop-shadow-md">
                    DOLPHINS
                </h1>
                <div className="h-1 w-12 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-white animate-loading-bar" />
                </div>
            </div>

            <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite;
        }
      `}</style>
        </div>
    )
}
