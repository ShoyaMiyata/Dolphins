import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type GroupMember = Database['public']['Tables']['group_members']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile
}

// グループメンバー一覧を取得（アクティブメンバーのみ）
export function useGroupMembers(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      console.log('グループメンバー取得開始:', groupId)
      if (!groupId) return []

      const { data: members, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)  // アクティブメンバーのみ取得
        .order('joined_at', { ascending: true })

      if (error) {
        console.error('メンバー取得エラー:', error)
        throw error
      }

      console.log('メンバー取得成功、プロフィール取得開始:', members?.length, '件')

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

      console.log('メンバー取得完了:', membersWithProfile?.length, '件')
      return membersWithProfile
    },
    enabled: !!groupId,
  })
}

// メンバーを削除（ソフト削除）
export function useRemoveGroupMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      console.log('メンバー削除開始:', { groupId, userId })

      // 現在のユーザーの権限を確認
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('認証が必要です')

      // データベース関数を使用してソフト削除
      const { data, error } = await (supabase as any)
        .rpc('soft_remove_member', {
          p_group_id: groupId,
          p_user_id: userId,
          p_remover_id: currentUser.id
        })

      console.log('ソフト削除結果:', { data, error })

      if (error) throw error
      if (!data) throw new Error('メンバーの削除に失敗しました')
    },
    onSuccess: (_, variables) => {
      console.log('メンバー削除成功、キャッシュ更新開始')

      // 現在のキャッシュデータを取得して更新
      const currentData = queryClient.getQueryData<GroupMemberWithProfile[]>(['group-members', variables.groupId])
      if (currentData) {
        console.log('現在のキャッシュデータ:', currentData.length, '件')
        // 削除されたメンバーをフィルタリングして新しいデータを設定
        const newData = currentData.filter(member => member.user_id !== variables.userId)
        console.log('更新後のキャッシュデータ:', newData.length, '件')
        queryClient.setQueryData(['group-members', variables.groupId], newData)
      }

      // 招待関連のクエリも無効化（削除されたユーザーが再び招待可能になるように）
      queryClient.invalidateQueries({ queryKey: ['all-users-for-invite', variables.groupId] })

      // 他の関連クエリも無効化
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })

      toast.success('メンバーを削除しました')
    },
    onError: (error: any) => {
      console.error('メンバー削除エラー:', error)
      const errorMessage = error?.message || 'メンバーの削除に失敗しました'
      toast.error(errorMessage)
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
      console.log('役割変更開始:', { groupId, userId, role })

      // 現在のユーザーの権限を確認
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('認証が必要です')

      const { data: currentUserMember } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single() as any

      console.log('現在のユーザー権限:', (currentUserMember as any)?.role)

      if (!['owner', 'admin'].includes(currentUserMember?.role)) {
        throw new Error('メンバーの役割を変更する権限がありません')
      }

      // 変更対象のメンバーを確認
      const { data: targetMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single() as any

      console.log('変更対象メンバー:', targetMember)

      if (!targetMember) {
        throw new Error('メンバーが見つかりません')
      }

      if ((targetMember as any).role === 'owner' && role !== 'owner') {
        throw new Error('オーナーの役割を変更できません')
      }

      const { error } = await (supabase as any)
        .from('group_members')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      console.log('役割変更結果:', { error })

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      console.log('役割変更成功、キャッシュ更新開始')

      // 現在のキャッシュデータを取得して更新
      const currentData = queryClient.getQueryData<GroupMemberWithProfile[]>(['group-members', variables.groupId])
      if (currentData) {
        console.log('現在のキャッシュデータ:', currentData.length, '件')
        // 変更されたメンバーの役割を更新
        const newData = currentData.map(member =>
          member.user_id === variables.userId
            ? { ...member, role: variables.role }
            : member
        )
        console.log('更新後のキャッシュデータ:', newData.length, '件')
        queryClient.setQueryData(['group-members', variables.groupId], newData)
      }

      // 他の関連クエリも無効化
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })

      toast.success('役割を変更しました')
    },
    onError: (error: any) => {
      console.error('役割変更エラー:', error)
      const errorMessage = error?.message || '役割の変更に失敗しました'
      toast.error(errorMessage)
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
      // 現在のユーザーを取得
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('認証が必要です')

      // リクエストを承認済みに更新（approved_by_user_idを設定）
      const { error: updateError } = await (supabase as any)
        .from('group_join_requests')
        .update({
          status: 'approved',
          approved_by_user_id: currentUser.id
        })
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
      const { error } = await (supabase as any)
        .from('group_join_requests')
        .update({ status: 'rejected' })
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

// グループから退会（ソフト削除）
export function useLeaveGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const userId = user.id

      // ソフト削除関数を使用
      const { data, error } = await (supabase as any)
        .rpc('soft_leave_group', {
          p_group_id: groupId,
          p_user_id: userId
        })

      if (error) throw error
      if (!data) throw new Error('グループ退会に失敗しました')
    },
    onSuccess: (_, variables) => {
      // 退会したグループのメンバーリストをクリア
      queryClient.removeQueries({ queryKey: ['group-members', variables] })
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

// ユーザーをグループに招待（直接追加または再招待）
export function useInviteUserToGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      console.log('招待開始:', { groupId, userId })

      console.log('supabase.auth.getUser() を呼び出し中...')
      // 現在のユーザーが管理者権限を持っているかチェック
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      console.log('supabase.auth.getUser() 完了:', { currentUser, userError })
      if (userError) {
        console.error('ユーザー取得エラー:', userError)
        throw new Error('ログインが必要です')
      }
      if (!currentUser) {
        throw new Error('ログインが必要です')
      }

      console.log('現在のユーザーID:', currentUser.id)

      // 現在のユーザーがグループのメンバーかチェック
      const { data: currentUserMember, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single() as any

      console.log('メンバー情報:', currentUserMember, 'エラー:', memberError)

      if (memberError) {
        console.error('メンバー取得エラー:', memberError)
        throw new Error('グループメンバー情報の取得に失敗しました')
      }

      if (!currentUserMember) {
        throw new Error('このグループのメンバーではありません')
      }

      console.log('ユーザーのロール:', currentUserMember.role)

      if (!['owner', 'admin'].includes(currentUserMember.role)) {
        throw new Error(`このグループの管理者権限が必要です。現在のロール: ${currentUserMember.role}`)
      }

      // 招待するユーザーが既にアクティブメンバーかチェック
      const { data: existingActiveMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (existingActiveMember) {
        throw new Error('このユーザーは既にメンバーです')
      }

      console.log('reactivate_member関数実行:', { group_id: groupId, user_id: userId, inviter_id: currentUser.id })

      // reactivate_member関数を使用して招待（新規または再招待）
      // p_inviter_idを渡すことで、関数内で通知が作成される
      const { data, error } = await (supabase as any)
        .rpc('reactivate_member', {
          p_group_id: groupId,
          p_user_id: userId,
          p_inviter_id: currentUser.id
        })

      console.log('招待結果:', { data, error })

      if (error) throw error
      if (!data) throw new Error('ユーザーの招待に失敗しました')

      // 通知はreactivate_member関数内で作成される
      return userId
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['all-users-for-invite', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('ユーザーをグループに招待しました')
    },
    onError: (error: any) => {
      console.error('ユーザー招待エラー:', error)
      console.error('エラー詳細:', JSON.stringify(error, null, 2))

      // Supabaseエラーの詳細を取得
      const errorMessage = error?.message ||
        (error?.code === 'PGRST301' ? '権限がありません。グループの管理者であることを確認してください。' :
          error?.code === '23505' ? 'このユーザーは既にメンバーです。' :
            'ユーザーの招待に失敗しました。')

      toast.error(errorMessage)
    },
  })
}

// 全ユーザーを取得（招待用）
export function useGetAllUsersForInvite(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['all-users-for-invite', groupId],
    queryFn: async () => {
      if (!groupId) return []

      // 既にアクティブなグループメンバーであるユーザーを除外
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('is_active', true)

      const memberIds = (members || []).map((m: any) => m.user_id)

      let queryBuilder = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, created_at')
        .order('username')

      if (memberIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${memberIds.join(',')})`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return data || []
    },
    enabled: !!groupId,
  })
}

// ユーザー検索（招待用）
export function useSearchUsersForInvite() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ query, groupId }: { query: string; groupId: string }) => {
      if (!query.trim()) return []

      // 既にアクティブなグループメンバーであるユーザーを除外
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('is_active', true)

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

// グループ設定を更新
export function useUpdateGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      groupId,
      updates
    }: {
      groupId: string
      updates: {
        name?: string
        description?: string
        visibility_type?: 'public' | 'private'
        join_type?: 'free' | 'approval'
      }
    }) => {
      // 更新データを準備
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.visibility_type !== undefined) updateData.visibility_type = updates.visibility_type
      if (updates.join_type !== undefined) updateData.join_type = updates.join_type

      const { data, error } = await (supabase as any)
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループ設定を更新しました')
    },
    onError: (error) => {
      console.error('グループ設定更新エラー:', error)
      toast.error('グループ設定の更新に失敗しました')
    },
  })
}
