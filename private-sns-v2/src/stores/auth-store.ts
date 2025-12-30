import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Profile } from '@/lib/supabase/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  setInitialized: (isInitialized: boolean) => void
  reset: () => void
}

export type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isInitialized: false,
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) =>
          set(
            { user, isLoading: false },
            false,
            'auth/setUser'
          ),

        setProfile: (profile) =>
          set(
            (state) => ({
              user: state.user
                ? {
                    ...state.user,
                    profile,
                  }
                : null,
            }),
            false,
            'auth/setProfile'
          ),

        setLoading: (isLoading) =>
          set(
            { isLoading },
            false,
            'auth/setLoading'
          ),

        setInitialized: (isInitialized) =>
          set(
            { isInitialized },
            false,
            'auth/setInitialized'
          ),

        reset: () =>
          set(
            initialState,
            false,
            'auth/reset'
          ),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
        }),
      }
    ),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Selectors for optimized component re-renders
export const selectUser = (state: AuthStore) => state.user
export const selectProfile = (state: AuthStore) => state.user?.profile
export const selectIsAuthenticated = (state: AuthStore) => !!state.user
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectIsInitialized = (state: AuthStore) => state.isInitialized
