import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type CustomStamp = Database['public']['Tables']['custom_stamps']['Row']

export interface CreateCustomStampData {
  image: File
  name?: string
}

// カスタムスタンプ一覧を取得
export function useCustomStamps() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['custom-stamps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_stamps')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('カスタムスタンプ取得エラー:', error)
        throw error
      }

      return data as CustomStamp[]
    },
  })
}

// カスタムスタンプを作成
export function useCreateCustomStamp() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ image, name }: CreateCustomStampData) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      const userId = user.id

      // ファイル名をサニタイズ（日本語・特殊文字を除去し、URL-safeにする）
      const sanitizedFileName = image.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // 英数字・ドット・ハイフン以外をアンダースコアに
        .replace(/_{2,}/g, '_') // 連続するアンダースコアを1つに
        .replace(/^_|_$/g, '') // 先頭と末尾のアンダースコアを除去
        .toLowerCase()

      // 拡張子を取得
      const fileExt = sanitizedFileName.split('.').pop() || 'png'
      const baseName = sanitizedFileName.replace(/\.[^/.]+$/, '') // 拡張子を除去

      // 安全なファイル名を生成
      const safeFileName = `${baseName}_${Date.now()}.${fileExt}`
      const fileName = `${userId}/${safeFileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('custom-stamps')
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('画像アップロードエラー:', uploadError)
        throw uploadError
      }

      // 画像の公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('custom-stamps')
        .getPublicUrl(fileName)

      // カスタムスタンプをデータベースに保存
      const { data, error } = await supabase
        .from('custom_stamps')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          name,
        } as any)
        .select()
        .single()

      if (error) {
        // アップロードに失敗したらファイルを削除
        await supabase.storage
          .from('custom-stamps')
          .remove([fileName])
        throw error
      }

      return data
    },
    onSuccess: () => {
      // カスタムスタンプ一覧を更新
      queryClient.invalidateQueries({ queryKey: ['custom-stamps'] })
      toast.success('カスタムスタンプを作成しました')
    },
    onError: (error) => {
      console.error('カスタムスタンプ作成エラー:', error)
      toast.error('カスタムスタンプの作成に失敗しました')
    },
  })
}

// カスタムスタンプを削除
export function useDeleteCustomStamp() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (stampId: string) => {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ログインが必要です')
      }

      // スタンプ情報を取得
      const { data: stamp, error: fetchError } = await supabase
        .from('custom_stamps')
        .select('image_url')
        .eq('id', stampId)
        .eq('user_id', user.id)
        .single() as any

      if (fetchError || !stamp) {
        throw new Error('スタンプが見つからないか、権限がありません')
      }

      // 画像ファイル名を抽出（例: userId/timestamp-filename.ext -> userId/timestamp-filename.ext）
      const urlParts = stamp.image_url.split('/')
      const fileName = urlParts.slice(-2).join('/') // 最後の2つの部分を取得

      // データベースから削除
      const { error: deleteError } = await supabase
        .from('custom_stamps')
        .delete()
        .eq('id', stampId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Storageからファイルを削除
      const { error: storageError } = await supabase.storage
        .from('custom-stamps')
        .remove([fileName])

      if (storageError) {
        console.warn('Storageからのファイル削除に失敗しましたが、データベースからは削除されました:', storageError)
      }
    },
    onSuccess: () => {
      // カスタムスタンプ一覧を更新
      queryClient.invalidateQueries({ queryKey: ['custom-stamps'] })
      toast.success('カスタムスタンプを削除しました')
    },
    onError: (error) => {
      console.error('カスタムスタンプ削除エラー:', error)
      toast.error('カスタムスタンプの削除に失敗しました')
    },
  })
}
