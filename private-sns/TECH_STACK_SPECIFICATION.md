# Dolphins (Private SNS) 技術スタック仕様書

## プロジェクト概要

**プロジェクト名**: Dolphins (Private SNS)
**バージョン**: 0.1.0
**説明**: 完全プライベートなSNSプラットフォーム - Instagram/Twitter風の機能を持つ安心して使えるSNS
**リポジトリ**: private-sns

---

## 1. フロントエンド

### 1.1 フレームワーク・ライブラリ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 16.0.7 | React フレームワーク（App Router） |
| **React** | 19.2.0 | UI ライブラリ |
| **React DOM** | 19.2.0 | React DOM レンダリング |
| **TypeScript** | ^5 | 型安全な開発 |

### 1.2 UI コンポーネント・スタイリング

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Tailwind CSS** | ^4 | ユーティリティファーストの CSS フレームワーク |
| **Radix UI** | 各種 ^1-2 | ヘッドレス UI コンポーネント集 |
| ├─ Alert Dialog | ^1.1.15 | モーダルダイアログ |
| ├─ Avatar | ^1.2.1 | アバター表示 |
| ├─ Button | ^1.1.15 | ボタン |
| ├─ Card | ^1.1.15 | カード |
| ├─ Checkbox | ^1.3.3 | チェックボックス |
| ├─ Dialog | ^1.1.15 | ダイアログ |
| ├─ Dropdown Menu | ^2.1.16 | ドロップダウンメニュー |
| ├─ Input | ^1.1.15 | テキスト入力 |
| ├─ Label | ^2.1.8 | ラベル |
| ├─ Popover | ^1.1.15 | ポップオーバー |
| ├─ Select | ^2.2.6 | セレクトボックス |
| ├─ Tabs | ^1.1.13 | タブ |
| ├─ Textarea | ^1.1.15 | 複数行テキスト入力 |
| └─ Tooltip | ^1.2.8 | ツールチップ |
| **Lucide React** | ^0.556.0 | アイコンライブラリ |
| **Framer Motion** | ^12.23.25 | アニメーションライブラリ |
| **clsx** | ^2.1.1 | クラス名の条件分岐ユーティリティ |
| **tailwind-merge** | ^3.4.0 | Tailwind クラス名のマージ |

### 1.3 画像処理

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **browser-image-compression** | ^2.0.2 | クライアントサイド画像圧縮 |
| **react-easy-crop** | ^5.5.6 | 画像クロップ UI |

### 1.4 データ可視化・仮想化

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **@tanstack/react-virtual** | ^3.13.12 | 仮想スクロール（パフォーマンス最適化） |

---

## 2. バックエンド・データベース

### 2.1 BaaS（Backend as a Service）

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Supabase** | - | リアルタイムデータベース・バックエンドプラットフォーム |
| **@supabase/supabase-js** | ^2.39.0 | Supabase JavaScript クライアント |
| **@supabase/ssr** | ^0.1.0 | Next.js SSR 統合 |

### 2.2 認証・認可

| 技術 | 用途 |
|------|------|
| **Supabase Auth** | 認証プラットフォーム |
| ├─ Email/Password | メールアドレス・パスワード認証 |
| ├─ Google OAuth | Google アカウント認証 |
| └─ Twitter OAuth | Twitter (X) アカウント認証 |

**Supabase プロジェクト**:
- URL: `https://pamfltdnxchmojdodeoe.supabase.co`
- Database: PostgreSQL

---

## 3. インフラ・ストレージ

### 3.1 オブジェクトストレージ

| 技術 | 用途 |
|------|------|
| **Supabase Storage** | 画像・ファイルストレージ |
| ├─ Bucket: `post-images` | 投稿画像 |
| └─ Bucket: `avatars` | ユーザーアバター画像 |

**設定**:
- 画像の自動最適化
- Public アクセス設定
- Row Level Security (RLS) によるアクセス制御

---

## 4. バリデーション

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Zod** | ^4.1.13 | スキーマバリデーション |

---

## 5. 開発ツール

### 5.1 Linter・Formatter

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **ESLint** | ^9 | JavaScript/TypeScript Linter |
| **eslint-config-next** | 16.0.7 | Next.js 公式 ESLint 設定 |
| **Prettier** | ^3.2.5 | コードフォーマッター |

### 5.2 型定義

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **@types/node** | ^20 | Node.js 型定義 |
| **@types/react** | ^19 | React 型定義 |
| **@types/react-dom** | ^19 | React DOM 型定義 |

---

## 6. TypeScript 設定

### 6.1 コンパイラオプション

```json
{
  "target": "ES2017",
  "lib": ["dom", "dom.iterable", "esnext"],
  "allowJs": true,
  "skipLibCheck": true,
  "strict": true,
  "noEmit": true,
  "esModuleInterop": true,
  "module": "esnext",
  "moduleResolution": "bundler",
  "resolveJsonModule": true,
  "isolatedModules": true,
  "jsx": "react-jsx",
  "incremental": true
}
```

### 6.2 パスエイリアス

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

---

## 7. Next.js 設定

### 7.1 画像最適化

```typescript
{
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pamfltdnxchmojdodeoe.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ],
    minimumCacheTTL: 604800, // 7日間
    deviceSizes: [320, 420, 640, 750, 828],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  }
}
```

---

## 8. データベーススキーマ（Supabase / PostgreSQL）

### 8.1 主要テーブル

| テーブル名 | 説明 |
|-----------|------|
| **profiles** | ユーザープロフィール情報（Supabase Auth 連携） |
| **posts** | 投稿（テキスト） |
| **post_images** | 投稿画像（複数枚対応） |
| **likes** | 投稿へのいいね |
| **comments** | 投稿へのコメント |
| **reposts** | リポスト/シェア |
| **reactions** | 絵文字リアクション |
| **follows** | フォロー関係 |
| **notifications** | 通知 |

### 8.2 主要機能

- **Row Level Security (RLS)**: Supabase の行レベルセキュリティによるアクセス制御
- **リアルタイム更新**: Supabase Realtime によるライブアップデート
- **複数画像対応**: `post_images` テーブルで最大5枚対応
- **絵文字リアクション**: Unicode 絵文字による多様なリアクション
- **リポスト/シェア**: Twitter 風のシェア機能
- **通知機能**: いいね・コメント・フォローの通知

---

## 9. 実行コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 (localhost:3000) |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm run format` | Prettier フォーマット実行 |

---

## 10. 主要機能

### 10.1 ユーザー機能
- ユーザー登録・認証（Supabase Auth）
  - メールアドレス/パスワード
  - Google OAuth
  - Twitter (X) OAuth
- プロフィール編集（アバター、表示名、bio）
- フォロー・フォロワー管理

### 10.2 投稿機能
- テキスト投稿
- 画像投稿（最大5枚）
- 画像圧縮・クロップ
- 投稿の編集・削除
- リアルタイム更新

### 10.3 インタラクション
- ❤️ いいね
- 💬 コメント
- 🔄 リポスト/シェア
- 😊 絵文字リアクション（複数種類）

### 10.4 タイムライン
- フォロー中のユーザー投稿表示
- 仮想スクロールによる高速表示
- リアルタイム更新

### 10.5 通知機能
- いいね通知
- コメント通知
- フォロー通知
- リポスト通知

---

## 11. セキュリティ・パフォーマンス

### 11.1 セキュリティ
- Supabase Auth による認証・認可
- Row Level Security (RLS) による行レベルアクセス制御
- 画像アップロード時の検証（サイズ・形式）
- CSRF 保護（Next.js ミドルウェア）

### 11.2 パフォーマンス最適化
- 画像の自動圧縮（クライアントサイド）
- 仮想スクロール（@tanstack/react-virtual）
- 画像キャッシュ（7日間）
- Next.js Image 最適化
- インクリメンタルビルド
- Server Components 活用

---

## 12. ディレクトリ構成

```
private-sns/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # 認証関連ページ
│   │   │   ├── login/       # ログインページ
│   │   │   └── signup/      # サインアップページ
│   │   ├── (main)/          # メインアプリ
│   │   │   ├── home/        # ホーム・タイムライン
│   │   │   ├── profile/     # プロフィール
│   │   │   ├── post/        # 投稿詳細
│   │   │   └── notifications/ # 通知
│   │   ├── api/             # API Routes
│   │   └── layout.tsx       # ルートレイアウト
│   ├── components/          # React コンポーネント
│   │   ├── ui/             # Radix UI ベースコンポーネント
│   │   ├── post/           # 投稿関連コンポーネント
│   │   ├── auth/           # 認証関連コンポーネント
│   │   └── layout/         # レイアウトコンポーネント
│   ├── lib/                # ユーティリティ・設定
│   │   ├── supabase/       # Supabase クライアント
│   │   ├── utils.ts        # ユーティリティ関数
│   │   └── validations.ts  # Zod バリデーション
│   ├── hooks/              # カスタムフック
│   ├── types/              # TypeScript 型定義
│   └── middleware.ts       # Next.js ミドルウェア
├── public/                 # 静的ファイル
├── docs/                   # ドキュメント
├── .env.local             # 環境変数（実際の設定）
├── next.config.ts         # Next.js 設定
├── tsconfig.json          # TypeScript 設定
├── eslint.config.mjs      # ESLint 設定
├── tailwind.config.ts     # Tailwind CSS 設定
├── postcss.config.mjs     # PostCSS 設定
└── package.json           # npm パッケージ設定
```

---

## 13. 環境変数

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pamfltdnxchmojdodeoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 14. PWA 対応

### 14.1 Viewport 設定
```typescript
{
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}
```

### 14.2 アイコン
- `/icon-192.png` (192x192)
- `/icon-512.png` (512x512)
- `/apple-icon.png` (Apple Touch Icon)

---

## 15. 今後の技術的課題

- [ ] PWA マニフェスト作成
- [ ] Service Worker 実装（オフライン対応）
- [ ] E2E テスト導入（Playwright）
- [ ] Storybook 導入（コンポーネントドキュメント）
- [ ] CI/CD パイプライン構築（GitHub Actions）
- [ ] パフォーマンスモニタリング（Vercel Analytics）
- [ ] エラートラッキング（Sentry）
- [ ] 画像の WebP 変換
- [ ] ダークモード対応

---

**作成日**: 2025-12-30
**最終更新**: 2025-12-30
