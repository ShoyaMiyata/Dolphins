# Post Features - 投稿機能

投稿の作成、表示、削除、更新機能を提供するコンポーネント群です。

## Components

### PostForm
投稿作成フォームコンポーネント

**Features:**
- テキスト入力（最大500文字）
- 画像アップロード（最大5枚）
- 画像の圧縮処理（browser-image-compression）
- 画像のトリミング機能（react-easy-crop）
- リアルタイム文字数カウント
- バリデーション（Zod + React Hook Form）

**Usage:**
```tsx
import { PostForm } from '@/components/features'

export default function HomePage() {
  return (
    <div>
      <PostForm onSuccess={() => console.log('投稿成功')} />
    </div>
  )
}
```

### PostCard
投稿表示カードコンポーネント

**Features:**
- ユーザー情報表示（アバター、表示名、ユーザー名）
- 投稿内容の表示
- 画像ギャラリー（複数画像対応）
- いいねボタン
- コメントボタン
- リポストボタン
- リアクションボタン
- 相対時刻表示（date-fns）
- 投稿者向けドロップダウンメニュー（編集・削除）
- 画像のフルスクリーン表示

**Usage:**
```tsx
import { PostCard } from '@/components/features'
import type { PostWithDetails } from '@/hooks/use-posts'

export default function PostPage({ post }: { post: PostWithDetails }) {
  return <PostCard post={post} />
}
```

### PostFeed
投稿フィード（無限スクロール対応）

**Features:**
- 投稿一覧の表示
- 無限スクロール（react-intersection-observer）
- ローディング状態
- エラー状態
- 空状態

**Usage:**
```tsx
import { PostFeed } from '@/components/features'

export default function FeedPage() {
  return (
    <div>
      <PostFeed />
    </div>
  )
}
```

## Hooks

### usePosts
投稿一覧取得（無限スクロール対応）

```tsx
import { usePosts } from '@/hooks/use-posts'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts()
```

### useCreatePost
投稿作成

```tsx
import { useCreatePost } from '@/hooks/use-posts'

const createPost = useCreatePost()

await createPost.mutateAsync({
  content: '投稿内容',
  images: [file1, file2], // オプション
})
```

### useUpdatePost
投稿更新

```tsx
import { useUpdatePost } from '@/hooks/use-posts'

const updatePost = useUpdatePost()

await updatePost.mutateAsync({
  postId: 'post-id',
  content: '更新後の内容',
})
```

### useDeletePost
投稿削除

```tsx
import { useDeletePost } from '@/hooks/use-posts'

const deletePost = useDeletePost()

await deletePost.mutateAsync('post-id')
```

### useLikePost / useUnlikePost
いいね / いいね解除

```tsx
import { useLikePost, useUnlikePost } from '@/hooks/use-posts'

const likePost = useLikePost()
const unlikePost = useUnlikePost()

await likePost.mutateAsync('post-id')
await unlikePost.mutateAsync('post-id')
```

### useRepost / useUnrepost
リポスト / リポスト解除

```tsx
import { useRepost, useUnrepost } from '@/hooks/use-posts'

const repost = useRepost()
const unrepost = useUnrepost()

await repost.mutateAsync('post-id')
await unrepost.mutateAsync('post-id')
```

## Validation Schema

投稿のバリデーションスキーマ

```tsx
import { postSchema, type PostFormData } from '@/validations/post'

// フォームデータの型
const data: PostFormData = {
  content: '投稿内容',
  images: [file1, file2],
}
```

## Complete Example

```tsx
'use client'

import { PostForm, PostFeed } from '@/components/features'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* 投稿フォーム */}
      <Card>
        <PostForm />
      </Card>

      <Separator className="my-0" />

      {/* 投稿フィード */}
      <PostFeed />
    </div>
  )
}
```

## Database Schema

このコンポーネントは以下のSupabaseテーブルを使用します：

- `posts` - 投稿データ
- `post_images` - 投稿画像
- `profiles` - ユーザープロフィール
- `likes` - いいね
- `comments` - コメント
- `reposts` - リポスト
- `reactions` - リアクション

## Storage Bucket

画像は `post-images` バケットに保存されます。
画像は自動的に圧縮され、最大1MB、最大解像度1920pxに調整されます。

## Dependencies

- `@tanstack/react-query` - データフェッチング
- `react-hook-form` - フォーム管理
- `zod` - バリデーション
- `@hookform/resolvers` - Zodリゾルバー
- `browser-image-compression` - 画像圧縮
- `react-easy-crop` - 画像トリミング
- `date-fns` - 日付フォーマット
- `sonner` - トースト通知
- `lucide-react` - アイコン
- `react-intersection-observer` - 無限スクロール

## Features Not Yet Implemented

以下の機能は今後実装予定：

- コメント機能の詳細実装
- リアクション機能の詳細実装
- メンション機能
- ハッシュタグ機能
- リンクプレビュー
- 動画アップロード
- GIFサポート
