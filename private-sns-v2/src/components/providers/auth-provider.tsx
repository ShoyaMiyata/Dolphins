'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)
  const setInitialized = useAuthStore((state) => state.setInitialized)

  useEffect(() => {
    const supabase = createClient()

    // 初回セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // プロフィール情報を取得
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              profile: profile || null,
            })
            setInitialized(true)
          })
      } else {
        setUser(null)
        setInitialized(true)
      }
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // プロフィール情報を取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email!,
          profile: profile || null,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setInitialized])

  return <>{children}</>
}
