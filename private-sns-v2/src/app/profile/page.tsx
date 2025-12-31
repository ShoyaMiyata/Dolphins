'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ProfileRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const redirectToUserProfile = async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (!session?.session?.user) {
        // 未認証の場合はログインページへ
        router.push('/login')
        return
      }

      // ユーザーのプロフィール情報を取得してusernameを取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.session.user.id)
        .single()

      if (error || !profile) {
        // エラーの場合はホームへ
        router.push('/')
        return
      }

      // ユーザーのプロフィールページへリダイレクト
      router.push(`/profile/${(profile as any).username}`)
    }

    redirectToUserProfile()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
