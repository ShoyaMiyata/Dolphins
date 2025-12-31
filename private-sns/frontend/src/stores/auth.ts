import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  // 現在のユーザー情報を取得
  async function fetchUser() {
    try {
      loading.value = true
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser

      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      loading.value = false
    }
  }

  // プロフィール情報を取得
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      profile.value = data
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // メールアドレスでサインアップ
  async function signUpWithEmail(email: string, password: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      })

      if (error) throw error

      // サインアップ成功後、ユーザー情報を更新
      if (data.user) {
        user.value = data.user
        await fetchProfile(data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error: error as AuthError }
    }
  }

  // メールアドレスでログイン
  async function signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        user.value = data.user
        await fetchProfile(data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error: error as AuthError }
    }
  }

  // Googleでログイン
  async function signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { data: null, error: error as AuthError }
    }
  }

  // Twitterでログイン
  async function signInWithTwitter() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in with Twitter:', error)
      return { data: null, error: error as AuthError }
    }
  }

  // ログアウト
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      user.value = null
      profile.value = null
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // 認証状態の変更を監視
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
    if (session?.user) {
      fetchProfile(session.user.id)
    } else {
      profile.value = null
    }
  })

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    fetchUser,
    fetchProfile,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithTwitter,
    signOut,
  }
})
