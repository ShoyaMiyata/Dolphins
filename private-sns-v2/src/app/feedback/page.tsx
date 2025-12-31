'use client'

import { useState, useEffect } from 'react'

// 動的レンダリングを強制（ビルド時のプリレンダリングを無効化）
export const dynamic = 'force-dynamic'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Send, User, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { Database } from '@/types/database.types'

type Feedback = {
  id: string
  user_id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'declined'
  created_at: string
  profiles?: {
    full_name?: string
    avatar_url?: string
  }
}

export default function FeedbackPage() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const user = useAuthStore((state) => state.user)
  const supabase = createClient()

  // フィードバック一覧を取得
  const fetchFeedbacks = async () => {
    if (!supabase) {
      console.warn('Supabase client is not available')
      setIsLoading(false)
      return
    }

    try {
      console.log('フィードバック取得開始')
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      console.log('フィードバック取得結果:', { data, error })

      if (error) throw error

      setFeedbacks(data || [])
      console.log('フィードバック件数:', data?.length)
    } catch (error) {
      console.error('フィードバック取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()

    if (!supabase) return

    // リアルタイム更新
    const channel = supabase
      .channel('feedbacks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedbacks' },
        () => {
          fetchFeedbacks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('内容を入力してください')
      return
    }

    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    if (!supabase) {
      toast.error('データベース接続が利用できません')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        content: content.trim(),
      } as any)

      if (error) throw error

      toast.success('フィードバックを送信しました')
      setContent('')
      fetchFeedbacks() // 一覧を更新
    } catch (error) {
      console.error('フィードバック送信エラー:', error)
      toast.error('送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: Feedback['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
            <Clock className="h-3 w-3" />
            検討中
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 animate-spin" />
            対応中
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            完了
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            却下
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '今日'
    if (diffDays === 2) return '昨日'
    if (diffDays <= 7) return `${diffDays}日前`

    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-background min-h-screen">
      <AppHeader />

      <main className="container max-w-md mx-auto px-4 py-6">
        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl">改善要望</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              アプリの改善点や新機能のご要望をお聞かせください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Textarea
                  placeholder="使いにくいところ、追加して欲しい機能など、ご自由にお書きください"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none text-base"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {content.length} 文字
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isSubmitting ? (
                  '送信中...'
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    フィードバックを送信
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>いただいたご意見は今後の開発の参考にさせていただきます</p>
          <p className="mt-1">ありがとうございます！</p>
        </div>

        {/* フィードバック一覧 */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            みんなの改善要望
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : feedbacks.length === 0 ? (
            <Card className="border-blue-100">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>まだフィードバックがありません</p>
                <p className="text-sm mt-1">最初の要望を送信してみましょう！</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">
                                {feedback.profiles?.full_name || '匿名ユーザー'}
                              </span>
                              {getStatusBadge(feedback.status)}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(feedback.created_at)}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {feedback.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
