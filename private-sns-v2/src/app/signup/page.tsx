'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isTwitterLoading, setIsTwitterLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      })

      if (error) {
        toast.error('アカウント登録に失敗しました', {
          description: error.message,
        })
        return
      }

      toast.success('アカウントを作成しました', {
        description: 'メールアドレスに確認メールを送信しました。',
      })
      router.push('/login')
    } catch (error) {
      toast.error('予期しないエラーが発生しました')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Google登録に失敗しました', {
          description: error.message,
        })
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました')
      console.error(error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleTwitterSignup = async () => {
    try {
      setIsTwitterLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Twitter登録に失敗しました', {
          description: error.message,
        })
      }
    } catch (error) {
      toast.error('予期しないエラーが発生しました')
      console.error(error)
    } finally {
      setIsTwitterLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-white shadow-2xl">
        <CardHeader className="space-y-4 pb-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src="/images/logo-circle.png"
                alt="Dolphins B.B.C."
                width={80}
                height={80}
                className="object-contain rounded-full ring-4 ring-blue-100 shadow-lg"
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              新規登録
            </CardTitle>
            <CardDescription className="text-gray-600">
              アカウントを作成して始めましょう
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full hover:bg-blue-50"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isTwitterLoading || isLoading}
            >
              {isGoogleLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  処理中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Googleで登録
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full hover:bg-blue-50"
              onClick={handleTwitterSignup}
              disabled={isGoogleLoading || isTwitterLoading || isLoading}
            >
              {isTwitterLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  処理中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitterで登録
                </span>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-gray-500 font-medium">
                または
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="dolphin_user"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                8文字以上、大文字・小文字・数字を含む
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              disabled={isLoading || isGoogleLoading || isTwitterLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  登録中...
                </span>
              ) : (
                'アカウントを作成'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-600 text-center">
            既にアカウントをお持ちの方は
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-700 hover:underline font-semibold ml-1"
            >
              ログイン
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
