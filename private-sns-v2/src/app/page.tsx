import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 認証済みユーザーは/homeにリダイレクト
  if (user) {
    redirect('/home')
  }

  return <LandingPage />
}
