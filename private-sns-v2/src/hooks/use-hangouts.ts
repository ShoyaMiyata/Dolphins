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

      // 自分が作成したものではなく、まだ回答していないhangoutsを取得
      const { data: hangouts, error: hangoutsError } = await supabase
        .from('hangouts')
        .select('*')
        .neq('user_id', userId)
        .order('created_at', { ascending: false })

      if (hangoutsError) throw hangoutsError

      // 各hangoutのプロファイルと回答を取得
      const hangoutsWithDetails = await Promise.all(
        (hangouts || []).map(async (hangout) => {
          // プロファイル取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('id', hangout.user_id)
            .single()

          // 回答取得
          const { data: responses } = await supabase
            .from('hangout_responses')
            .select('id, user_id, response')
            .eq('hangout_id', hangout.id)

          return {
            ...hangout,
            profiles: profile,
            hangout_responses: responses || []
          }
        })
      )

      // 自分の回答がまだないものだけフィルタリング
      const pendingHangouts = hangoutsWithDetails.filter(
        (hangout) => !hangout.hangout_responses.some((r: any) => r.user_id === userId)
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

      const { data: hangouts, error: hangoutsError } = await supabase
        .from('hangouts')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })

      if (hangoutsError) throw hangoutsError

      // 各hangoutのプロファイルと回答を取得
      const hangoutsWithDetails = await Promise.all(
        (hangouts || []).map(async (hangout) => {
          // プロファイル取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('id', hangout.user_id)
            .single()

          // 回答とそのプロファイルを取得
          const { data: responses } = await supabase
            .from('hangout_responses')
            .select('id, response, user_id')
            .eq('hangout_id', hangout.id)

          // 各回答のプロファイルを取得
          const responsesWithProfiles = await Promise.all(
            (responses || []).map(async (response) => {
              const { data: responseProfile } = await supabase
                .from('profiles')
                .select('display_name, username, avatar_url')
                .eq('id', response.user_id)
                .single()

              return {
                ...response,
                profiles: responseProfile
              }
            })
          )

          return {
            ...hangout,
            profiles: profile,
            hangout_responses: responsesWithProfiles
          }
        })
      )

      return hangoutsWithDetails
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

      const { data, error } = await supabase
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

        const { error: visibilityError } = await supabase
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

      const { data, error } = await supabase
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

      const { data: result, error } = await supabase
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
