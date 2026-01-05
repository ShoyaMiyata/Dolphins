'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const setUser = useAuthStore((state) => state.setUser)
  const setInitialized = useAuthStore((state) => state.setInitialized)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    const supabase = createClient()

    // 初回セッション取得
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setUser(null)
          setInitialized(true)
          return
        }

        if (session?.user) {
          // プロフィール情報を取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            profile: profile || null,
          }

          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setInitialized(true)
      }
    }

    initializeAuth()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          // プロフィール情報を取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            profile: profile || null,
          }

          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      }
    })

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setInitialized])

  // 認証状態が初期化された後にリダイレクトチェック（ミドルウェアと競合しないように）
  useEffect(() => {
    // 認証状態が初期化されていない場合は何もしない
    if (!isInitialized) {
      return
    }

    const protectedPaths = ['/home', '/profile', '/notifications', '/search', '/hangouts']
    const authPaths = ['/login', '/signup']
    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    )
    const isAuthPath = authPaths.some((path) =>
      pathname.startsWith(path)
    )

    // 未認証ユーザーを保護されたページからログインページへリダイレクト
    if (!user && isProtectedPath && !isAuthPath) {
      router.push('/login')
      return
    }

    // 認証済みユーザーを認証ページからホーム画面へリダイレクト
    if (user && isAuthPath && !window.location.search.includes('redirect')) {
      router.push('/home')
      return
    }
  }, [pathname, user, isInitialized, router])

  return <>{children}</>
}
