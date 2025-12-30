'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Bell, User, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUnreadNotificationsCount } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const { data: unreadCount } = useUnreadNotificationsCount()

  const username = user?.profile?.username || ''

  const navItems = [
    {
      name: 'ホーム',
      icon: Home,
      href: '/home',
      isActive: pathname === '/home',
    },
    {
      name: '検索',
      icon: Search,
      href: '/search',
      isActive: pathname === '/search',
    },
    {
      name: '遊び',
      icon: Calendar,
      href: '/hangouts',
      isActive: pathname === '/hangouts',
      isCenter: true,
    },
    {
      name: '通知',
      icon: Bell,
      href: '/notifications',
      isActive: pathname === '/notifications',
      badge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: 'プロフィール',
      icon: User,
      href: `/profile/${username}`,
      isActive: pathname === `/profile/${username}`,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-100 bg-white/98 backdrop-blur-md shadow-lg"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon

          // Center button special styling
          if (item.isCenter) {
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center justify-center"
              >
                <div
                  className={cn(
                    'w-14 h-14 -mt-8 rounded-full shadow-lg flex items-center justify-center',
                    'bg-gradient-to-r from-blue-500 to-sky-500 text-white',
                    'transition-all duration-200',
                    'hover:scale-105 active:scale-95',
                    item.isActive ? 'ring-4 ring-blue-200' : ''
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
              </Link>
            )
          }

          const content = (
            <div
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 relative px-2 py-1 rounded-lg',
                'transition-all duration-150',
                item.isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50'
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />

                {/* Active Indicator */}
                {item.isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}

                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500 hover:bg-blue-600 border-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  </div>
                )}
              </div>

              <span
                className={cn('text-xs font-medium', item.isActive && 'font-semibold')}
              >
                {item.name}
              </span>
            </div>
          )

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex-1 h-full"
              aria-label={item.name}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
