import { useUser } from './use-user'

export function useIsAdmin() {
  const { user, profile } = useUser()

  const isAdmin = profile?.role === 'admin'

  return {
    isAdmin,
    user,
    profile,
  }
}

// Hook to check if current user is admin
export function useAdmin() {
  const { user, profile } = useUser()

  return {
    isAdmin: profile?.role === 'admin',
    isUser: !!user,
    user,
    profile,
  }
}
