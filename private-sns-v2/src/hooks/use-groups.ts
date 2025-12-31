import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

type Group = Database['public']['Tables']['groups']['Row']
type GroupMember = Database['public']['Tables']['group_members']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export type GroupWithDetails = Group & {
  profiles: Profile
  member_count: number
  is_member: boolean
  is_owner: boolean
}

export interface CreateGroupData {
  name: string
  description?: string
  image?: File
  joinType: 'free' | 'approval'
  visibilityType: 'public' | 'private'
}

export interface UpdateGroupData {
  groupId: string
  name?: string
  description?: string
  image?: File
  joinType?: 'free' | 'approval'
  visibilityType?: 'public' | 'private'
}

// 画像圧縮オプション
const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
}

// 画像をStorageにアップロード
async function uploadImage(file: File, userId: string): Promise<string> {
  const supabase = createClient()

  // 画像を圧縮
  const compressedFile = await imageCompression(file, compressionOptions)

  // ファイル名を生成
  const fileExt = compressedFile.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Storageにアップロード
  const { data, error } = await supabase.storage
    .from('group-images')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('group-images')
    .getPublicUrl(data.path)

  return publicUrl
}

// グループ一覧を取得
export function useGroups() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // グループを取得
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('グループ取得エラー:', error)
        throw error
      }

      // 各グループのメンバー数とメンバーシップを取得
      const groupsWithDetails = await Promise.all(
        (groups || []).map(async (group: any) => {
          // オーナーのプロフィールを取得
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', group.owner_id)
            .single()

          // メンバー数を取得
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          // 自分がメンバーかどうかを確認
          const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', group.id)
            .eq('user_id', user.id)
            .maybeSingle()

          return {
            ...group,
            profiles: ownerProfile,
            member_count: count || 0,
            is_member: !!membership,
            is_owner: membership?.role === 'owner',
          }
        })
      )

      return groupsWithDetails as GroupWithDetails[]
    },
  })
}

// 特定のグループを取得
export function useGroup(groupId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!groupId) return null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error('グループ取得エラー:', error)
        throw error
      }

      // オーナーのプロフィールを取得
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', group.owner_id)
        .single()

      // メンバー数を取得
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      // 自分がメンバーかどうかを確認
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()

      return {
        ...group,
        profiles: ownerProfile,
        member_count: count || 0,
        is_member: !!membership,
        is_owner: membership?.role === 'owner',
      } as GroupWithDetails
    },
    enabled: !!groupId,
  })
}

// グループ作成
export function useCreateGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ name, description, image, joinType, visibilityType }: CreateGroupData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id
      let imageUrl: string | undefined

      // 画像がある場合はアップロード
      if (image) {
        imageUrl = await uploadImage(image, userId)
      }

      // グループ作成
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          image_url: imageUrl,
          owner_id: userId,
          join_type: joinType,
          visibility_type: visibilityType,
        } as any)
        .select()
        .single()

      if (groupError) throw groupError

      // オーナーをメンバーとして追加
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: (group as any).id,
          user_id: userId,
          role: 'owner',
        } as any)

      if (memberError) throw memberError

      return group
    },
    onSuccess: () => {
      // グループ一覧を更新
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループを作成しました')
    },
    onError: (error) => {
      console.error('グループ作成エラー:', error)
      toast.error('グループの作成に失敗しました')
    },
  })
}

// グループ更新
export function useUpdateGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ groupId, name, description, image, joinType, visibilityType }: UpdateGroupData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      let imageUrl: string | undefined

      // 画像がある場合はアップロード
      if (image) {
        imageUrl = await uploadImage(image, user.id)
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (imageUrl) updateData.image_url = imageUrl
      if (joinType !== undefined) updateData.join_type = joinType
      if (visibilityType !== undefined) updateData.visibility_type = visibilityType

      const { data, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // グループ詳細を更新
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
      // グループ一覧も更新
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループを更新しました')
    },
    onError: (error) => {
      console.error('グループ更新エラー:', error)
      toast.error('グループの更新に失敗しました')
    },
  })
}

// グループ削除
export function useDeleteGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      // 画像を取得して削除
      const { data: group } = await supabase
        .from('groups')
        .select('image_url')
        .eq('id', groupId)
        .single()

      if (group?.image_url) {
        // Storage から画像を削除
        const url = new URL(group.image_url)
        const imagePath = url.pathname.split('/group-images/')[1]

        await supabase.storage
          .from('group-images')
          .remove([imagePath])
      }

      // グループ削除（カスケード削除で関連データも削除される）
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: () => {
      // グループ一覧を更新
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループを削除しました')
    },
    onError: (error) => {
      console.error('グループ削除エラー:', error)
      toast.error('グループの削除に失敗しました')
    },
  })
}

// グループに参加
export function useJoinGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      // グループ情報を取得
      const { data: group } = await supabase
        .from('groups')
        .select('join_type')
        .eq('id', groupId)
        .single()

      if (!group) throw new Error('グループが見つかりません')

      // 自由参加の場合は直接メンバーに追加
      if (group.join_type === 'free') {
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: user.id,
            role: 'member',
          } as any)

        if (error) throw error
      } else {
        // 承認制の場合は参加リクエストを作成
        const { error } = await supabase
          .from('group_join_requests')
          .insert({
            group_id: groupId,
            user_id: user.id,
          } as any)

        if (error) throw error
      }
    },
    onSuccess: (_, groupId) => {
      // グループ詳細を更新
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      // グループ一覧も更新
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループに参加しました')
    },
    onError: (error) => {
      console.error('グループ参加エラー:', error)
      toast.error('グループへの参加に失敗しました')
    },
  })
}

// グループから退出
export function useLeaveGroup() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: (_, groupId) => {
      // グループ詳細を更新
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      // グループ一覧も更新
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('グループから退出しました')
    },
    onError: (error) => {
      console.error('グループ退出エラー:', error)
      toast.error('グループからの退出に失敗しました')
    },
  })
}
