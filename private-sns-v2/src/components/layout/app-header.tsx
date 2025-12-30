'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Home as HomeIcon, LogOut, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const reset = useAuthStore((state) => state.reset)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Hamburger Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-blue-600">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-lg">メニュー</SheetTitle>
              </SheetHeader>

              <div className="space-y-3">
                {/* Menu Items */}
                <div className="space-y-1">
                  <Link href="/home" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-base">
                      <HomeIcon className="h-5 w-5" />
                      ホーム
                    </Button>
                  </Link>

                  <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2 text-base">
                      <ExternalLink className="h-5 w-5" />
                      ランディングページ
                    </Button>
                  </a>
                </div>

                <Separator className="my-3" />

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  ログアウト
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/images/logo-text.png?v=2"
              alt="Dolphins B.B.C."
              width={160}
              height={50}
              className="object-contain logo-blue-filter"
              priority
            />
          </div>

          {/* Spacer for balance */}
          <div className="w-10" />
        </div>
      </div>
    </header>
  )
}
