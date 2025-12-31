import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Hangout = Database['public']['Tables']['hangouts']['Row']
type HangoutInsert = Database['public']['Tables']['hangouts']['Insert']
type HangoutResponse = Database['public']['Tables']['hangout_responses']['Row']

interface HangoutWithProfile extends Hangout {
  profiles: {
    display_name: string | null
    username: string
    avatar_url: string | null
  }
  hangout_responses: HangoutResponse[]
}

// 回答済みのhangoutsを取得
export function useRespondedHangouts() {
  return useQuery({
    queryKey: ['hangouts', 'responded'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (!session?.session?.user) {
        throw new Error('Not authenticated')
      }

      const userId = session.session.user.id

      // 1つのクエリで全て取得 (JOINを使用)
      const { data: responses, error } = await supabase
        .from('hangout_responses')
        .select(`
          hangout_id,
          response,
          created_at,
          hangouts (
            *,
            profiles:user_id (
              display_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!responses || responses.length === 0) return []

      // データを整形
      return responses.map((response: any) => ({
        ...response.hangouts,
        profiles: response.hangouts.profiles,
        my_response: response.response,
        responded_at: response.created_at
      }))
    },
  })
}

// 未回答のhangoutsを取得
export function usePendingHangouts() {
  return useQuery({
    queryKey: ['hangouts', 'pending'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (!session?.session?.user) {
        throw new Error('Not authenticated')
      }

      const userId = session.session.user.id

      // 1つのクエリで全て取得 (JOINを使用)
      const { data: hangouts, error } = await supabase
        .from('hangouts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          ),
          hangout_responses (
            id,
            user_id,
            response
          )
        `)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 自分の回答がまだないものだけフィルタリング
      const pendingHangouts = (hangouts || []).filter(
        (hangout: any) => !hangout.hangout_responses.some((r: any) => r.user_id === userId)
      )

      return pendingHangouts
    },
  })
}

// 自分が作成したhangoutsと回答を取得
export function useMyHangouts() {
  return useQuery({
    queryKey: ['hangouts', 'my'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (!session?.session?.user) {
        throw new Error('Not authenticated')
      }

      // 1つのクエリで全て取得 (JOINを使用)
      const { data: hangouts, error } = await supabase
        .from('hangouts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          ),
          hangout_responses (
            id,
            response,
            user_id,
            profiles:user_id (
              display_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return hangouts || []
    },
  })
}

// hangoutを作成
export function useCreateHangout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      hangout,
      selectedUsers
    }: {
      hangout: Omit<HangoutInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>
      selectedUsers?: string[]
    }) => {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await (supabase as any)
        .from('hangouts')
        .insert({
          ...hangout,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // 公開範囲が選択制の場合、hangout_visibilityに追加
      if (data && hangout.visibility_type === 'selected' && selectedUsers && selectedUsers.length > 0) {
        const visibilityData = selectedUsers.map(userId => ({
          hangout_id: data.id,
          user_id: userId,
        }))

        const { error: visibilityError } = await (supabase as any)
          .from('hangout_visibility')
          .insert(visibilityData)

        if (visibilityError) {
          console.error('Failed to set visibility:', visibilityError)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hangouts'] })
    },
  })
}

// hangoutに回答
export function useRespondToHangout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      hangoutId,
      response,
    }: {
      hangoutId: string
      response: 'yes' | 'no' | 'maybe'
    }) => {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      if (!session?.session?.user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await (supabase as any)
        .from('hangout_responses')
        .upsert({
          hangout_id: hangoutId,
          user_id: session.session.user.id,
          response,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hangouts'] })
    },
  })
}

// hangoutを更新
export function useUpdateHangout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      hangoutId,
      data
    }: {
      hangoutId: string
      data: Partial<Omit<HangoutInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    }) => {
      const supabase = createClient()

      const { data: result, error } = await (supabase as any)
        .from('hangouts')
        .update(data)
        .eq('id', hangoutId)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hangouts'] })
    },
  })
}

// hangoutを削除
export function useDeleteHangout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (hangoutId: string) => {
      const supabase = createClient()

      console.log('useDeleteHangout: Starting delete for ID:', hangoutId)

      const { data, error } = await supabase
        .from('hangouts')
        .delete()
        .eq('id', hangoutId)
        .select()

      console.log('useDeleteHangout: Delete response:', { data, error })

      if (error) {
        console.error('Delete hangout error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('Delete returned no data - might not exist or no permission')
      }

      return data
    },
    onSuccess: (data) => {
      console.log('useDeleteHangout: Delete successful, invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['hangouts'] })
    },
    onError: (error) => {
      console.error('Failed to delete hangout:', error)
    },
  })
}
