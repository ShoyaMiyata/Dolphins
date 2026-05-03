import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let cachedClient: SupabaseClient<Database> | null = null

export function createClient() {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

  // 環境に応じたリダイレクトURLを設定
  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return undefined

    const currentUrl = new URL(window.location.href)
    const isLocalhost = currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1'

    if (isLocalhost) {
      return `${currentUrl.protocol}//${currentUrl.host}/auth/callback`
    }

    // 本番環境の場合は現在のドメインを使用
    return `${currentUrl.protocol}//${currentUrl.host}/auth/callback`
  }

  cachedClient = createBrowserClient<Database>(
    url,
    key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'X-Client-Info': 'dolphins-sns-client',
        },
      },
    }
  )

  return cachedClient
}
