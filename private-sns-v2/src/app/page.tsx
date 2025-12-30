import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 認証済みユーザーは/homeにリダイレクト
  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-sky-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Image
            src="/images/logo-text.png?v=2"
            alt="Dolphins B.B.C."
            width={180}
            height={60}
            className="object-contain logo-blue-filter"
            priority
          />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">ログイン</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md">新規登録</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative w-48 h-48 animate-bounce">
              <Image
                src="/images/logo-circle.png?v=2"
                alt="TOHKATSU Dolphins"
                fill
                className="object-contain drop-shadow-2xl logo-blue-filter"
                priority
              />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            東葛ドルフィンズ<br />プライベートSNS
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            東葛飾高校バスケ部<br />チームメンバー専用SNS
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 shadow-lg hover:shadow-xl transition-all">
                無料で始める
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="p-8 rounded-2xl bg-white shadow-md border border-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-blue-600">安全なプライバシー</h3>
            <p className="text-gray-600 leading-relaxed">
              あなたの投稿は承認した人だけが見ることができます。
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white shadow-md border border-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-blue-600">つながる</h3>
            <p className="text-gray-600 leading-relaxed">
              大切な人たちと簡単につながり、近況を共有できます。
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white shadow-md border border-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-blue-600">シンプルで使いやすい</h3>
            <p className="text-gray-600 leading-relaxed">
              直感的なデザインで、誰でも簡単に使い始められます。
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4 text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
          >
            東葛 Dolphins 公式サイトはこちら →
          </a>
          <p className="text-sm text-muted-foreground">&copy; 2025 東葛 Dolphins B.B.C. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
