import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type GroupMember = Database['public']['Tables']['group_members']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile
}

// グループメンバー一覧を取得
export function useGroupMembers(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return []

      const { data: members, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('メンバー取得エラー:', error)
        throw error
      }

      // 各メンバーのプロフィールを取得
      const membersWithProfile: GroupMemberWithProfile[] = await Promise.all(
        (members || []).map(async (member: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', member.user_id)
            .single()

          return {
            ...member,
            profiles: profile,
          }
        })
      )

      return membersWithProfile
    },
    enabled: !!groupId,
  })
}

// メンバーを削除
export function useRemoveGroupMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      toast.success('メンバーを削除しました')
    },
    onError: (error) => {
      console.error('メンバー削除エラー:', error)
      toast.error('メンバーの削除に失敗しました')
    },
  })
}

// メンバーの役割を変更
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      role,
    }: {
      groupId: string
      userId: string
      role: 'owner' | 'admin' | 'member'
    }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role } as any)
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      toast.success('役割を変更しました')
    },
    onError: (error) => {
      console.error('役割変更エラー:', error)
      toast.error('役割の変更に失敗しました')
    },
  })
}

// 参加リクエスト一覧を取得
export function useGroupJoinRequests(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['group-join-requests', groupId],
    queryFn: async () => {
      if (!groupId) return []

      const { data: requests, error } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('参加リクエスト取得エラー:', error)
        throw error
      }

      // 各リクエストのプロフィールを取得
      const requestsWithProfile = await Promise.all(
        (requests || []).map(async (request: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', request.user_id)
            .single()

          return {
            ...request,
            profiles: profile,
          }
        })
      )

      return requestsWithProfile
    },
    enabled: !!groupId,
  })
}

// 参加リクエストを承認
export function useApproveJoinRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ requestId, groupId, userId }: { requestId: string; groupId: string; userId: string }) => {
      // リクエストを承認済みに更新
      const { error: updateError } = await supabase
        .from('group_join_requests')
        .update({ status: 'approved' } as any)
        .eq('id', requestId)

      if (updateError) throw updateError

      // メンバーとして追加
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        } as any)

      if (insertError) throw insertError
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      toast.success('参加リクエストを承認しました')
    },
    onError: (error) => {
      console.error('参加リクエスト承認エラー:', error)
      toast.error('参加リクエストの承認に失敗しました')
    },
  })
}

// 参加リクエストを拒否
export function useRejectJoinRequest() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ requestId, groupId }: { requestId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'rejected' } as any)
        .eq('id', requestId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', variables.groupId] })
      toast.success('参加リクエストを拒否しました')
    },
    onError: (error) => {
      console.error('参加リクエスト拒否エラー:', error)
      toast.error('参加リクエストの拒否に失敗しました')
    },
  })
}

// グループに参加（参加リクエストを作成または直接参加）
export function useJoinGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, joinType }: { groupId: string; joinType: 'free' | 'approval' }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      if (joinType === 'free') {
        // 自由参加の場合は直接メンバーとして追加
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: userId,
            role: 'member',
          } as any)

        if (error) throw error
      } else {
        // 承認制の場合は参加リクエストを作成
        const { error } = await supabase
          .from('group_join_requests')
          .insert({
            group_id: groupId,
            user_id: userId,
            status: 'pending',
          } as any)

        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(variables.joinType === 'free' ? 'グループに参加しました' : '参加リクエストを送信しました')
    },
    onError: (error) => {
      console.error('グループ参加エラー:', error)
      toast.error('グループ参加に失敗しました')
    },
  })
}

// グループから退会
export function useLeaveGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables] })
      queryClient.invalidateQueries({ queryKey: ['group', variables] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループから退会しました')
    },
    onError: (error) => {
      console.error('グループ退会エラー:', error)
      toast.error('グループ退会に失敗しました')
    },
  })
}

// ユーザーをグループに招待（直接追加）
export function useInviteUserToGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      // 招待するユーザーが既にメンバーかチェック
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        throw new Error('このユーザーは既にメンバーです')
      }

      // メンバーに追加
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        } as any)

      if (error) throw error

      return userId
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('ユーザーをグループに招待しました')
    },
    onError: (error) => {
      console.error('ユーザー招待エラー:', error)
      toast.error(error.message || 'ユーザーの招待に失敗しました')
    },
  })
}

// ユーザー検索（招待用）
export function useSearchUsersForInvite() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ query, groupId }: { query: string; groupId: string }) => {
      if (!query.trim()) return []

      // 既にグループメンバーであるユーザーを除外
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

      const memberIds = (members || []).map((m: any) => m.user_id)

      let queryBuilder = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10)

      if (memberIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${memberIds.join(',')})`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return data || []
    },
  })
}
