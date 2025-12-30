import { z } from 'zod'

// ログインフォームのスキーマ
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// サインアップフォームのスキーマ
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含む必要があります'
    ),
  confirmPassword: z
    .string()
    .min(1, 'パスワードを再入力してください'),
  username: z
    .string()
    .min(1, 'ユーザー名を入力してください')
    .min(2, 'ユーザー名は2文字以上で入力してください')
    .max(50, 'ユーザー名は50文字以内で入力してください')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます'
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

export type SignupFormData = z.infer<typeof signupSchema>
