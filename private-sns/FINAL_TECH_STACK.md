# Dolphins (Private SNS) - 最終技術スタック仕様書

## 🎯 プロジェクトゴール
**世界最高のプライベートSNS体験を提供する**

---

## 📦 完全な依存関係リスト

### Core Framework
```json
{
  "next": "16.0.7",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5"
}
```

### UI Framework & Styling
```json
{
  "@radix-ui/react-alert-dialog": "^1.1.15",
  "@radix-ui/react-avatar": "^1.2.1",
  "@radix-ui/react-checkbox": "^1.3.3",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-label": "^2.1.8",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-separator": "^1.2.1",
  "@radix-ui/react-slot": "^1.2.1",
  "@radix-ui/react-tabs": "^1.1.13",
  "@radix-ui/react-toast": "^1.2.5",
  "@radix-ui/react-tooltip": "^1.2.8",
  "tailwindcss": "^4.0.0",
  "tailwind-merge": "^3.4.0",
  "tailwindcss-animate": "^1.0.7",
  "clsx": "^2.1.1",
  "class-variance-authority": "^0.7.1"
}
```

### State Management
```json
{
  "@tanstack/react-query": "^5.62.23",
  "@tanstack/react-query-devtools": "^5.62.23",
  "zustand": "^5.0.2"
}
```

### Form & Validation
```json
{
  "react-hook-form": "^7.54.2",
  "@hookform/resolvers": "^3.9.1",
  "zod": "^3.24.1"
}
```

### Backend (Supabase)
```json
{
  "@supabase/supabase-js": "^2.48.1",
  "@supabase/ssr": "^0.6.0"
}
```

### Icons & Animations
```json
{
  "lucide-react": "^0.468.0",
  "framer-motion": "^12.23.25"
}
```

### Image Processing
```json
{
  "browser-image-compression": "^2.0.2",
  "react-easy-crop": "^5.5.6"
}
```

### Notifications
```json
{
  "sonner": "^2.0.0"
}
```

### Utilities
```json
{
  "@tanstack/react-virtual": "^3.13.12",
  "date-fns": "^4.1.0",
  "react-intersection-observer": "^9.14.0"
}
```

### Development Tools
```json
{
  "@types/node": "^22",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.0.7",
  "prettier": "^3.4.2",
  "prettier-plugin-tailwindcss": "^0.6.11",
  "@typescript-eslint/eslint-plugin": "^8.21.0",
  "@typescript-eslint/parser": "^8.21.0"
}
```

### Testing (オプション - 初期は不要)
```json
{
  "vitest": "^3.0.0",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@vitejs/plugin-react": "^4.4.0"
}
```

### Monitoring (本番環境用)
```json
{
  "@vercel/analytics": "^1.4.2",
  "@vercel/speed-insights": "^1.2.0",
  "@sentry/nextjs": "^8.44.0"
}
```

---

## 🎨 shadcn/ui コンポーネント

以下のコンポーネントを使用：

```bash
# インストールするコンポーネント一覧
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add popover
npx shadcn@latest add tabs
npx shadcn@latest add tooltip
npx shadcn@latest add separator
npx shadcn@latest add badge
npx shadcn@latest add skeleton
```

---

## 🏗️ プロジェクト構造（完全版）

```
private-sns/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                   # 認証レイアウトグループ
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (main)/                   # メインアプリレイアウトグループ
│   │   │   ├── layout.tsx            # メインレイアウト
│   │   │   ├── page.tsx              # ホーム（タイムライン）
│   │   │   ├── post/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     # 投稿詳細
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # 新規投稿
│   │   │   ├── profile/
│   │   │   │   ├── [username]/
│   │   │   │   │   ├── page.tsx     # プロフィール
│   │   │   │   │   ├── followers/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── following/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx     # プロフィール編集
│   │   │   └── notifications/
│   │   │       └── page.tsx          # 通知
│   │   ├── api/                      # API Routes
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts
│   │   ├── layout.tsx                # ルートレイアウト
│   │   ├── globals.css               # グローバルCSS
│   │   └── providers.tsx             # Providers (React Query, etc.)
│   │
│   ├── components/                    # React コンポーネント
│   │   ├── ui/                       # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── ...
│   │   ├── auth/                     # 認証関連
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── oauth-buttons.tsx
│   │   ├── post/                     # 投稿関連
│   │   │   ├── post-card.tsx
│   │   │   ├── post-form.tsx
│   │   │   ├── post-actions.tsx
│   │   │   ├── like-button.tsx
│   │   │   ├── comment-section.tsx
│   │   │   ├── repost-button.tsx
│   │   │   └── reaction-picker.tsx
│   │   ├── timeline/                 # タイムライン
│   │   │   ├── timeline.tsx
│   │   │   └── virtual-timeline.tsx
│   │   ├── profile/                  # プロフィール
│   │   │   ├── profile-header.tsx
│   │   │   ├── profile-edit-form.tsx
│   │   │   └── follow-button.tsx
│   │   ├── image/                    # 画像処理
│   │   │   ├── image-uploader.tsx
│   │   │   ├── image-cropper.tsx
│   │   │   └── image-gallery.tsx
│   │   ├── notification/             # 通知
│   │   │   ├── notification-list.tsx
│   │   │   └── notification-item.tsx
│   │   └── layout/                   # レイアウト
│   │       ├── header.tsx
│   │       ├── bottom-nav.tsx
│   │       └── sidebar.tsx
│   │
│   ├── lib/                          # ユーティリティ・設定
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase クライアント
│   │   │   ├── server.ts            # Supabase サーバー
│   │   │   └── middleware.ts        # Supabase ミドルウェア
│   │   ├── react-query/
│   │   │   ├── client.ts            # React Query クライアント
│   │   │   └── prefetch.ts          # プリフェッチユーティリティ
│   │   ├── utils.ts                  # ユーティリティ関数
│   │   ├── cn.ts                     # className マージ
│   │   └── constants.ts              # 定数
│   │
│   ├── hooks/                        # カスタムフック
│   │   ├── use-auth.ts              # 認証フック
│   │   ├── use-post.ts              # 投稿フック
│   │   ├── use-timeline.ts          # タイムラインフック
│   │   ├── use-like.ts              # いいねフック
│   │   ├── use-comment.ts           # コメントフック
│   │   ├── use-follow.ts            # フォローフック
│   │   ├── use-notification.ts      # 通知フック
│   │   └── use-image-upload.ts      # 画像アップロードフック
│   │
│   ├── stores/                       # Zustand Store
│   │   ├── ui-store.ts              # UI状態
│   │   └── auth-store.ts            # 認証状態
│   │
│   ├── types/                        # TypeScript 型定義
│   │   ├── database.types.ts        # Supabase 自動生成型
│   │   ├── post.ts
│   │   ├── user.ts
│   │   └── index.ts
│   │
│   ├── validations/                  # Zod バリデーション
│   │   ├── auth.ts
│   │   ├── post.ts
│   │   ├── profile.ts
│   │   └── comment.ts
│   │
│   └── middleware.ts                 # Next.js ミドルウェア
│
├── public/                           # 静的ファイル
│   ├── icons/
│   ├── images/
│   └── fonts/
│
├── docs/                             # ドキュメント
│   ├── TECH_STACK_SPECIFICATION.md
│   ├── REQUIREMENTS.md
│   └── FINAL_TECH_STACK.md
│
├── supabase/                         # Supabase 設定（オプション）
│   ├── migrations/
│   └── seed.sql
│
├── .env.local                        # 環境変数
├── .env.example                      # 環境変数サンプル
├── next.config.ts                    # Next.js 設定
├── tsconfig.json                     # TypeScript 設定
├── tailwind.config.ts                # Tailwind CSS 設定
├── components.json                   # shadcn/ui 設定
├── eslint.config.mjs                 # ESLint 設定
├── prettier.config.mjs               # Prettier 設定
├── postcss.config.mjs                # PostCSS 設定
├── vitest.config.ts                  # Vitest 設定（オプション）
└── package.json                      # npm パッケージ設定
```

---

## ⚙️ 設定ファイル

### next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pamfltdnxchmojdodeoe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    minimumCacheTTL: 604800, // 7日間
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
```

### components.json (shadcn/ui)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... その他のカラー定義
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 🚀 インストールコマンド

### 1. Next.js プロジェクト作成
```bash
npx create-next-app@latest private-sns-v2 --typescript --tailwind --app --src-dir --import-alias "@/*"
cd private-sns-v2
```

### 2. 全依存関係インストール
```bash
# Core Dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools zustand
npm install react-hook-form @hookform/resolvers zod
npm install @supabase/supabase-js @supabase/ssr
npm install sonner
npm install browser-image-compression react-easy-crop
npm install @tanstack/react-virtual date-fns react-intersection-observer
npm install framer-motion lucide-react
npm install class-variance-authority clsx tailwind-merge

# Radix UI Components
npm install @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip

# Dev Dependencies
npm install -D prettier prettier-plugin-tailwindcss @typescript-eslint/eslint-plugin @typescript-eslint/parser tailwindcss-animate

# Vercel Analytics (本番用)
npm install @vercel/analytics @vercel/speed-insights
```

### 3. shadcn/ui セットアップ
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label textarea avatar dropdown-menu dialog popover tabs tooltip separator badge skeleton
```

---

## 🎯 開発優先度

### Phase 1: セットアップ（Day 1）
1. ✅ Next.js プロジェクト作成
2. ✅ 全依存関係インストール
3. ✅ shadcn/ui セットアップ
4. ✅ Supabase 統合
5. ✅ React Query 設定
6. ✅ 基本レイアウト

### Phase 2: 認証（Day 2）
7. ✅ 認証フォーム（shadcn/ui）
8. ✅ OAuth 統合

### Phase 3: 投稿機能（Day 3-4）
9. ✅ 投稿作成フォーム（React Hook Form）
10. ✅ 画像アップロード（react-easy-crop）
11. ✅ 投稿一覧（仮想スクロール）

### Phase 4: インタラクション（Day 5-6）
12. ✅ いいね・コメント・リポスト
13. ✅ 絵文字リアクション
14. ✅ 通知システム（Sonner）

### Phase 5: 最適化（Day 7）
15. ✅ パフォーマンス最適化
16. ✅ Vercel デプロイ

---

**作成日**: 2025-12-30
**ステータス**: Ready to Build 🚀
