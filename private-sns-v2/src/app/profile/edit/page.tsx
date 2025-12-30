'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Loader2, X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileEditPage() {
  const router = useRouter()
  const { user, profile, isUpdating, updateProfile, uploadAvatar, deleteAvatar } = useUser()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 認証チェック
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください')
      return
    }

    setAvatarFile(file)

    // プレビュー表示
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error('ユーザー名は必須です')
      return
    }

    // ユーザー名の形式チェック (英数字とアンダースコアのみ)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      toast.error('ユーザー名は英数字とアンダースコアのみ使用できます')
      return
    }

    // アバターの変更がある場合
    if (avatarFile) {
      const result = await uploadAvatar(avatarFile)
      if (!result.success) {
        return
      }
    } else if (avatarPreview === null && profile?.avatar_url) {
      // アバターを削除する場合
      const result = await deleteAvatar()
      if (!result.success) {
        return
      }
    }

    // プロフィール情報を更新
    const result = await updateProfile({
      display_name: displayName.trim() || null,
      username: username.trim(),
      bio: bio.trim() || null,
    })

    if (result.success) {
      router.push(`/profile/${username}`)
    }
  }

  const handleCancel = () => {
    if (profile?.username) {
      router.push(`/profile/${profile.username}`)
    } else {
      router.push('/home')
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="md:hidden text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-blue-900">プロフィール編集</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <Card className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-blue-100 hover:border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">プロフィール情報</CardTitle>
            <CardDescription className="text-blue-600">
              公開されるプロフィール情報を編集できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* アバター */}
              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">プロフィール画像</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 border-4 border-white ring-4 ring-blue-100 shadow-lg">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                      {displayName?.[0] || username[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                    >
                      <Camera className="h-4 w-4" />
                      画像を変更
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <X className="h-4 w-4" />
                        画像を削除
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-sm text-blue-600">
                  推奨: 正方形の画像、最大5MB
                </p>
              </div>

              {/* 表示名 */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-blue-900 font-semibold">表示名（ニックネーム）</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="表示名を入力"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                />
                <p className="text-sm text-blue-600">
                  {displayName.length} / 50
                </p>
              </div>

              {/* ユーザー名 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-blue-900 font-semibold">ユーザー名 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                    @
                  </span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    maxLength={30}
                    className="pl-7 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
                <p className="text-sm text-blue-600">
                  英数字とアンダースコアのみ使用可能。{username.length} / 30
                </p>
              </div>

              {/* 自己紹介 */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-blue-900 font-semibold">自己紹介</Label>
                <Textarea
                  id="bio"
                  placeholder="自己紹介を入力"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={4}
                  className="border-blue-100 focus:border-blue-300 focus:ring-blue-200 resize-none"
                />
                <p className="text-sm text-blue-600">
                  {bio.length} / 160
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !username.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 危険な操作エリア */}
        <Card className="mt-6 border-red-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">危険な操作</CardTitle>
            <CardDescription>
              以下の操作は取り消すことができません
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              アカウントを削除
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              アカウント削除機能は今後実装予定です
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
