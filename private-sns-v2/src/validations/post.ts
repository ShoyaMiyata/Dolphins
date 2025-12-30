import { z } from 'zod'

export const postSchema = z.object({
  content: z
    .string()
    .min(1, '投稿内容を入力してください')
    .max(500, '投稿内容は500文字以内で入力してください')
    .optional()
    .nullable(),
  images: z
    .array(z.instanceof(File))
    .max(5, '画像は最大5枚まで投稿できます')
    .optional(),
})

export type PostFormData = z.infer<typeof postSchema>

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, '投稿内容を入力してください')
    .max(500, '投稿内容は500文字以内で入力してください'),
})

export type UpdatePostFormData = z.infer<typeof updatePostSchema>
