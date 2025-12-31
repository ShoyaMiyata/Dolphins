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
        console.log('Client-side: Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Client-side session result:', { hasSession: !!session, userId: session?.user?.id, error })

        if (error) {
          console.error('セッション取得エラー:', error)
          setUser(null)
          setInitialized(true)
          return
        }

        if (session?.user) {
          console.log('Client-side: User authenticated, fetching profile...')
          // プロフィール情報を取得
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('プロフィール取得エラー:', profileError)
          }

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            profile: profile || null,
          }

          console.log('Client-side: Setting user data:', userData)
          setUser(userData)
          console.log('Client-side: User set successfully')
        } else {
          console.log('Client-side: No authenticated user')
          setUser(null)
        }
      } catch (error) {
        console.error('認証初期化エラー:', error)
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
      console.log('認証状態変更:', event, {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })

      try {
        if (session?.user) {
          console.log('認証済みユーザー検知、プロフィール取得開始')

          // プロフィール情報を取得（タイムアウト付き）
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          )

          try {
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any

            console.log('プロフィール取得完了:', { hasProfile: !!profile, error: profileError?.code })

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('プロフィール取得エラー:', profileError)
            }

            const userData = {
              id: session.user.id,
              email: session.user.email!,
              profile: profile || null,
            }

            console.log('ユーザー状態設定:', userData)
            setUser(userData)
            console.log('認証状態変更処理完了')
          } catch (profileError: any) {
            console.error('プロフィール取得タイムアウトまたはエラー:', profileError?.message)

            // プロフィールが取得できなくても基本情報だけ設定して先に進める
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              profile: null,
            }

            console.log('プロフィールなしでユーザー状態設定:', userData)
            setUser(userData)
            console.log('認証状態変更処理完了（プロフィールなし）')
          }
        } else {
          console.log('認証なし、ユーザー状態をnullに設定')
          setUser(null)
        }
      } catch (error) {
        console.error('認証状態変更エラー:', error)
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
    // （ミドルウェアがサーバーサイドで処理するが、クライアントサイドでも確認）
    if (!user && isProtectedPath && !isAuthPath) {
      console.log('Client redirect: unauthenticated user to login from:', pathname)
      router.push('/login')
      return
    }

    // 認証済みユーザーを認証ページからホーム画面へリダイレクト
    // （ミドルウェアがサーバーサイドで処理するが、状態変化時の確認）
    if (user && isAuthPath && !window.location.search.includes('redirect')) {
      console.log('Client redirect: authenticated user to home from:', pathname)
      router.push('/home')
      return
    }
  }, [pathname, user, isInitialized, router])

  return <>{children}</>
}
