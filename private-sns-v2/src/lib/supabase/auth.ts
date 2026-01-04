import { createClient } from './client'
import type { Database } from '@/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse<T = void> {
  data: T | null
  error: AuthError | null
}

export interface SignUpCredentials {
  email: string
  password: string
  username: string
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  profile: Profile | null
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail({
  email,
  password,
}: SignInCredentials): Promise<AuthResponse<User>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'ユーザー情報を取得できませんでした',
        },
      }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return {
      data: {
        id: data.user.id,
        email: data.user.email!,
        profile: profile || null,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'ログインに失敗しました',
      },
    }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    // 環境に応じたリダイレクトURLを設定
    const currentUrl = new URL(window.location.href)
    const isLocalhost = currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1'
    const redirectTo = isLocalhost
      ? 'http://localhost:3000/auth/callback'
      : `${currentUrl.protocol}//${currentUrl.host}/auth/callback`

    console.log('Google OAuth redirectTo:', redirectTo)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Googleログインに失敗しました',
      },
    }
  }
}



/**
 * Sign up with email and password
 */
export async function signUpWithEmail({
  email,
  password,
  username,
}: SignUpCredentials): Promise<AuthResponse<User>> {
  try {
    const supabase = createClient()

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingProfile) {
      return {
        data: null,
        error: {
          message: 'このユーザー名は既に使用されています',
          code: 'username_taken',
        },
      }
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    if (!data.user) {
      return {
        data: null,
        error: {
          message: 'ユーザー登録に失敗しました',
        },
      }
    }

    // Create profile (this might be handled by a database trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username,
        display_name: username,
      } as any)

    if (profileError && profileError.code !== '23505') {
      // Ignore duplicate key error (profile already created by trigger)
      console.error('Profile creation error:', profileError)
    }

    // Fetch created profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return {
      data: {
        id: data.user.id,
        email: data.user.email!,
        profile: profile || null,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'ユーザー登録に失敗しました',
      },
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'ログアウトに失敗しました',
      },
    }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    // 環境に応じたリダイレクトURLを設定
    const currentUrl = new URL(window.location.href)
    const isLocalhost = currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1'
    const redirectTo = isLocalhost
      ? 'http://localhost:3000/auth/reset-password'
      : `${currentUrl.protocol}//${currentUrl.host}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'パスワードリセットに失敗しました',
      },
    }
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'パスワードの更新に失敗しました',
      },
    }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { data: null, error }
    }

    return { data: data.session, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'セッション取得に失敗しました',
      },
    }
  }
}

/**
 * Get current user with profile
 */
export async function getCurrentUser(): Promise<AuthResponse<User>> {
  try {
    const supabase = createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
        },
      }
    }

    if (!user) {
      return {
        data: null,
        error: null,
      }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      data: {
        id: user.id,
        email: user.email!,
        profile: profile || null,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました',
      },
    }
  }
}
