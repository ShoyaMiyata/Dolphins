import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  follower_count?: [{ count: number }] | number
  following_count?: [{ count: number }] | number
}

import {
  useAuthStore,
  selectUser,
  selectProfile,
  selectIsAuthenticated,
} from '@/stores/auth-store'
import { toast } from 'sonner'

type UpdateProfileData = Database['public']['Tables']['profiles']['Update']

export function useUser() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const setProfile = useAuthStore((state) => state.setProfile)

  const [isUpdating, setIsUpdating] = useState(false)

  // Update profile data
  const updateProfile = useCallback(
    async (updates: UpdateProfileData) => {
      if (!user?.id) {
        toast.error('ユーザー情報が取得できませんでした')
        return { success: false, error: { message: 'Not authenticated' } }
      }

      setIsUpdating(true)
      try {
        const supabase = createClient()

        // If username is being updated, check if it's already taken
        if (updates.username && updates.username !== profile?.username) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', updates.username)
            .single()

          if (existingProfile) {
            toast.error('このユーザー名は既に使用されています')
            return {
              success: false,
              error: { message: 'Username already taken' },
            }
          }
        }

        // Update profile
        const { data, error } = await supabase
          .from('profiles')
          // @ts-expect-error - Supabase type inference issue with update
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single()

        if (error) {
          toast.error('プロフィールの更新に失敗しました', {
            description: error.message,
          })
          return {
            success: false,
            error: { message: error.message },
          }
        }

        setProfile(data)
        toast.success('プロフィールを更新しました')
        return { success: true, error: null }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました'
        toast.error('プロフィールの更新に失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setIsUpdating(false)
      }
    },
    [user?.id, profile?.username, setProfile]
  )

  // Upload avatar image
  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) {
        toast.error('ユーザー情報が取得できませんでした')
        return { success: false, error: { message: 'Not authenticated' } }
      }

      setIsUpdating(true)
      try {
        const supabase = createClient()

        // Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          toast.error('画像のアップロードに失敗しました', {
            description: uploadError.message,
          })
          return {
            success: false,
            error: { message: uploadError.message },
          }
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath)

        // Update profile with new avatar URL
        const result = await updateProfile({ avatar_url: publicUrl })

        if (result.success) {
          toast.success('プロフィール画像を更新しました')
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '画像のアップロードに失敗しました'
        toast.error('画像のアップロードに失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setIsUpdating(false)
      }
    },
    [user?.id, updateProfile]
  )

  // Delete avatar image
  const deleteAvatar = useCallback(async () => {
    if (!user?.id || !profile?.avatar_url) {
      return { success: false, error: { message: 'No avatar to delete' } }
    }

    setIsUpdating(true)
    try {
      const supabase = createClient()

      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const filePath = url.pathname.split('/').slice(-2).join('/')

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.error('Avatar deletion error:', deleteError)
      }

      // Update profile to remove avatar URL
      const result = await updateProfile({ avatar_url: null })

      if (result.success) {
        toast.success('プロフィール画像を削除しました')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像の削除に失敗しました'
      toast.error('画像の削除に失敗しました', {
        description: errorMessage,
      })
      return {
        success: false,
        error: { message: errorMessage },
      }
    } finally {
      setIsUpdating(false)
    }
  }, [user?.id, profile?.avatar_url, updateProfile])

  // Upload cover image
  const uploadCoverImage = useCallback(
    async (file: File) => {
      if (!user?.id) {
        toast.error('ユーザー情報が取得できませんでした')
        return { success: false, error: { message: 'Not authenticated' } }
      }

      setIsUpdating(true)
      try {
        const supabase = createClient()

        // Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `cover-${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('cover-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          toast.error('カバー画像のアップロードに失敗しました', {
            description: uploadError.message,
          })
          return {
            success: false,
            error: { message: uploadError.message },
          }
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('cover-images').getPublicUrl(filePath)

        // Update profile with new cover image URL
        const result = await updateProfile({ cover_image_url: publicUrl })

        if (result.success) {
          toast.success('カバー画像を更新しました')
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'カバー画像のアップロードに失敗しました'
        toast.error('カバー画像のアップロードに失敗しました', {
          description: errorMessage,
        })
        return {
          success: false,
          error: { message: errorMessage },
        }
      } finally {
        setIsUpdating(false)
      }
    },
    [user?.id, updateProfile]
  )

  // Delete cover image
  const deleteCoverImage = useCallback(async () => {
    if (!user?.id || !profile?.cover_image_url) {
      return { success: false, error: { message: 'No cover image to delete' } }
    }

    setIsUpdating(true)
    try {
      const supabase = createClient()

      // Extract file path from URL
      const url = new URL(profile.cover_image_url)
      const filePath = url.pathname.split('/').slice(-2).join('/')

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('cover-images')
        .remove([filePath])

      if (deleteError) {
        console.error('Cover image deletion error:', deleteError)
      }

      // Update profile to remove cover image URL
      const result = await updateProfile({ cover_image_url: null })

      if (result.success) {
        toast.success('カバー画像を削除しました')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カバー画像の削除に失敗しました'
      toast.error('カバー画像の削除に失敗しました', {
        description: errorMessage,
      })
      return {
        success: false,
        error: { message: errorMessage },
      }
    } finally {
      setIsUpdating(false)
    }
  }, [user?.id, profile?.cover_image_url, updateProfile])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      return
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile refresh error:', error)
        return
      }

      setProfile(data)
    } catch (err) {
      console.error('Profile refresh error:', err)
    }
  }, [user?.id, setProfile])

  return {
    user,
    profile,
    isAuthenticated,
    isUpdating,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    uploadCoverImage,
    deleteCoverImage,
    refreshProfile,
  }
}

/**
 * Hook to fetch a specific user's profile by ID
 */
export function useUserProfile(userId: string | null) {
  const supabase = createClient()

  return useQuery<Profile | null, Error>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          follower_count:follows!follows_following_id_fkey(count),
          following_count:follows!follows_follower_id_fkey(count)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      if (!data) return null

      const profileData = data as any
      // カウントデータを正規化
      return {
        ...profileData,
        follower_count: Array.isArray(profileData.follower_count) ? profileData.follower_count[0]?.count || 0 : 0,
        following_count: Array.isArray(profileData.following_count) ? profileData.following_count[0]?.count || 0 : 0,
      } as Profile
    },
    enabled: !!userId,
  })
}

/**
 * Hook to fetch a user's profile by username
 */
export function useUserProfileByUsername(username: string | null) {
  const supabase = createClient()

  return useQuery<Profile | null, Error>({
    queryKey: ['profileByUsername', username],
    queryFn: async () => {
      if (!username) return null
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          follower_count:follows!follows_following_id_fkey(count),
          following_count:follows!follows_follower_id_fkey(count)
        `)
        .eq('username', username)
        .single()

      if (error) throw error
      if (!data) return null

      const profileData = data as any
      // カウントデータを正規化
      return {
        ...profileData,
        follower_count: Array.isArray(profileData.follower_count) ? profileData.follower_count[0]?.count || 0 : 0,
        following_count: Array.isArray(profileData.following_count) ? profileData.following_count[0]?.count || 0 : 0,
      } as Profile
    },
    enabled: !!username,
  })
}
/**
 * Hook to track and update the user's last access time
 */
export function useTrackLastAccess() {
  const user = useAuthStore(selectUser)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const trackAccess = async () => {
      try {
        const supabase = createClient()
        await supabase
          .from('profiles')
          // @ts-expect-error - Supabase type inference issue
          .update({
            last_access_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      } catch (err) {
        // Silent error for tracking
        console.error('Failed to track last access:', err)
      }
    }

    trackAccess()
  }, [isAuthenticated, user?.id])
}
