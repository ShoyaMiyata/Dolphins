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

      // まず自分のレスポンスを取得
      const { data: responses, error: responsesError } = await supabase
        .from('hangout_responses')
        .select('hangout_id, response, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (responsesError) throw responsesError
      if (!responses || responses.length === 0) return []

      // hangout_idのリストを取得
      const hangoutIds = (responses as any[]).map((r: any) => r.hangout_id)

      // 対応するhangoutsを取得
      const { data: hangouts, error: hangoutsError } = await supabase
        .from('hangouts')
        .select('*')
        .in('id', hangoutIds)

      if (hangoutsError) throw hangoutsError

      // 作成者のプロフィールを取得
      const userIds = [...new Set((hangouts as any[]).map((h: any) => h.user_id))]
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // データを整形
      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      const hangoutsMap = new Map((hangouts as any[]).map((h: any) => [h.id, h]))

      return (responses as any[]).map((response: any) => {
        const hangout = hangoutsMap.get(response.hangout_id)
        return hangout ? {
          ...hangout,
          profiles: profilesMap.get(hangout.user_id) || null,
          my_response: response.response,
          responded_at: response.created_at
        } : null
      }).filter(Boolean)
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

      // hangoutsを取得
      const { data: hangouts, error: hangoutsError } = await supabase
        .from('hangouts')
        .select('*')
        .neq('user_id', userId)
        .order('created_at', { ascending: false })

      if (hangoutsError) throw hangoutsError
      if (!hangouts || hangouts.length === 0) return []

      // 作成者のプロフィールを取得
      const userIds = [...new Set((hangouts as any[]).map((h: any) => h.user_id))]
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // データを結合
      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      const hangoutsWithProfiles = (hangouts as any[]).map((hangout: any) => ({
        ...hangout,
        profiles: profilesMap.get(hangout.user_id) || null
      }))

      // 自分の回答を取得
      const hangoutIds = (hangouts as any[]).map((h: any) => h.id)
      const { data: responses, error: responsesError } = await supabase
        .from('hangout_responses')
        .select('hangout_id, user_id, response')
        .in('hangout_id', hangoutIds)
        .eq('user_id', userId)

      if (responsesError) throw responsesError

      // 自分の回答があるhangoutを除外
      const respondedHangoutIds = new Set((responses || []).map((r: any) => r.hangout_id))
      const pendingHangouts = hangoutsWithProfiles.filter(
        (hangout: any) => !respondedHangoutIds.has(hangout.id)
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

      // 自分のhangoutsを取得
      const { data: hangouts, error: hangoutsError } = await supabase
        .from('hangouts')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })

      if (hangoutsError) throw hangoutsError
      if (!hangouts || hangouts.length === 0) return []

      // 自分のプロフィールを取得
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .eq('id', session.session.user.id)
        .single()

      if (profileError) throw profileError

      // hangoutsにプロフィールを追加
      const hangoutsWithProfiles = (hangouts as any[]).map((hangout: any) => ({
        ...hangout,
        profiles: myProfile
      }))

      // hangout_idのリストを取得
      const hangoutIds = (hangouts as any[]).map((h: any) => h.id)

      // 対応するレスポンスを取得
      const { data: responses, error: responsesError } = await supabase
        .from('hangout_responses')
        .select('id, response, user_id, hangout_id')
        .in('hangout_id', hangoutIds)

      if (responsesError) throw responsesError

      // レスポンスのユーザー情報を取得
      const responseUserIds = [...new Set((responses || []).map((r: any) => r.user_id))]
      const { data: responseProfiles, error: responseProfilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', responseUserIds)

      if (responseProfilesError) throw responseProfilesError

      // レスポンスにプロフィールを結合
      const responseProfilesMap = new Map((responseProfiles || []).map((p: any) => [p.id, p]))
      const responsesWithProfiles = (responses || []).map((response: any) => ({
        ...response,
        profiles: responseProfilesMap.get(response.user_id) || null
      }))

      // レスポンスをhangoutごとにグループ化
      const responsesByHangout = new Map()
      responsesWithProfiles.forEach((response: any) => {
        const hangoutId = response.hangout_id
        if (!responsesByHangout.has(hangoutId)) {
          responsesByHangout.set(hangoutId, [])
        }
        responsesByHangout.get(hangoutId).push(response)
      })

      // hangoutsにレスポンスを追加
      return (hangouts as any[]).map((hangout: any) => ({
        ...hangout,
        hangout_responses: responsesByHangout.get(hangout.id) || []
      }))
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
        .upsert(
          {
            hangout_id: hangoutId,
            user_id: session.session.user.id,
            response,
          },
          {
            onConflict: 'hangout_id,user_id',
            ignoreDuplicates: false
          }
        )
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
