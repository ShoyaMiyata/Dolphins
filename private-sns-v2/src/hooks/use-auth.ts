import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithTwitter,
  signUpWithEmail,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  getCurrentUser,
  type SignInCredentials,
  type SignUpCredentials,
} from '@/lib/supabase/auth'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()
  const {
    user,
    isLoading,
    isInitialized,
    setUser,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    if (isInitialized) return

    const initAuth = async () => {
      setLoading(true)
      try {
        const { data, error } = await getCurrentUser()

        if (error) {
          console.error('Auth initialization error:', error)
          setUser(null)
        } else {
          setUser(data)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setUser(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    initAuth()
  }, [isInitialized, setUser, setLoading, setInitialized])

  // Listen to auth state changes
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data } = await getCurrentUser()
        setUser(data)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const { data } = await getCurrentUser()
        setUser(data)
      } else if (event === 'USER_UPDATED' && session) {
        const { data } = await getCurrentUser()
        setUser(data)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser])

  // Sign in with email/password
  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      setLoading(true)
      try {
        const { data, error } = await signInWithEmail(credentials)

        if (error) {
          toast.error('ログインに失敗しました', {
            description: error.message,
          })
          return { success: false, error }
        }

        setUser(data)
        toast.success('ログインしました')
        router.push('/')
        return { success: true, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
        toast.error('ログインに失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setUser, router]
  )

  // Sign in with Google
  const signInGoogle = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()

      if (error) {
        toast.error('Googleログインに失敗しました', {
          description: error.message,
        })
        return { success: false, error }
      }

      // OAuth redirect will happen automatically
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Googleログインに失敗しました'
      toast.error('Googleログインに失敗しました', {
        description: errorMessage,
      })
      return {
        success: false,
        error: { message: errorMessage },
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  // Sign in with Twitter
  const signInTwitter = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await signInWithTwitter()

      if (error) {
        toast.error('Twitterログインに失敗しました', {
          description: error.message,
        })
        return { success: false, error }
      }

      // OAuth redirect will happen automatically
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Twitterログインに失敗しました'
      toast.error('Twitterログインに失敗しました', {
        description: errorMessage,
      })
      return {
        success: false,
        error: { message: errorMessage },
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  // Sign up with email/password
  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      setLoading(true)
      try {
        const { data, error } = await signUpWithEmail(credentials)

        if (error) {
          toast.error('ユーザー登録に失敗しました', {
            description: error.message,
          })
          return { success: false, error }
        }

        setUser(data)
        toast.success('ユーザー登録が完了しました', {
          description: 'メールアドレスの確認をお願いします',
        })
        router.push('/')
        return { success: true, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'ユーザー登録に失敗しました'
        toast.error('ユーザー登録に失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setUser, router]
  )

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await authSignOut()

      if (error) {
        toast.error('ログアウトに失敗しました', {
          description: error.message,
        })
        return { success: false, error }
      }

      reset()
      toast.success('ログアウトしました')
      router.push('/auth/login')
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      toast.error('ログアウトに失敗しました', {
        description: errorMessage,
      })
      return {
        success: false,
        error: { message: errorMessage },
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, reset, router])

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      setLoading(true)
      try {
        const { error } = await authResetPassword(email)

        if (error) {
          toast.error('パスワードリセットに失敗しました', {
            description: error.message,
          })
          return { success: false, error }
        }

        toast.success('パスワードリセットメールを送信しました', {
          description: 'メールをご確認ください',
        })
        return { success: true, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'パスワードリセットに失敗しました'
        toast.error('パスワードリセットに失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading]
  )

  // Update password
  const updatePassword = useCallback(
    async (newPassword: string) => {
      setLoading(true)
      try {
        const { error } = await authUpdatePassword(newPassword)

        if (error) {
          toast.error('パスワードの更新に失敗しました', {
            description: error.message,
          })
          return { success: false, error }
        }

        toast.success('パスワードを更新しました')
        router.push('/')
        return { success: true, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'パスワードの更新に失敗しました'
        toast.error('パスワードの更新に失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, router]
  )

  return {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    signIn,
    signInGoogle,
    signInTwitter,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}
