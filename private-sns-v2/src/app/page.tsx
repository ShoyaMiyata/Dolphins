import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('Server-side session check:', { hasSession: !!session, userId: session?.user?.id, error })

  // 認証済みユーザーは/homeにリダイレクト
  if (session?.user) {
    console.log('Redirecting authenticated user to /home')
    redirect('/home')
  }

  return <LandingPage />
}
