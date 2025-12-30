# Dolphins Private SNS - セットアップガイド

完全プライベートSNSのセットアップ手順を説明します。

## 📋 目次

1. [必要な環境](#必要な環境)
2. [プロジェクトのセットアップ](#プロジェクトのセットアップ)
3. [Supabaseのセットアップ](#supabaseのセットアップ)
4. [OAuth設定（Google/Twitter）](#oauth設定)
5. [開発サーバーの起動](#開発サーバーの起動)
6. [デプロイ（Vercel）](#デプロイ)

---

## 🔧 必要な環境

- Node.js 18.0以降
- npm または pnpm
- Supabaseアカウント
- Vercelアカウント（デプロイ時）

---

## 📦 プロジェクトのセットアップ

### 1. 依存関係のインストール

```bash
cd /Users/shohya-miyata/Dolphins/private-sns-v2
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルは既に作成済みですが、必要に応じて確認してください：

```bash
cat .env.local
```

---

## 🗄️ Supabaseのセットアップ

### ステップ1: データベーステーブルの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `pamfltdnxchmojdodeoe` を選択
3. 左サイドバーから **SQL Editor** を選択
4. `supabase-setup.sql` の内容をコピー＆ペースト
5. **Run** ボタンをクリックして実行

これにより以下が作成されます：
- 9つのテーブル（profiles, posts, post_images, likes, comments, reposts, reactions, follows, notifications）
- インデックス（パフォーマンス最適化）
- Row Level Security (RLS) ポリシー（セキュリティ）
- 自動プロフィール作成トリガー
- 自動タイムスタンプ更新トリガー

### ステップ2: Storageバケットの作成

1. Supabase Dashboardの左サイドバーから **Storage** を選択
2. **New bucket** ボタンをクリック
3. 以下の2つのバケットを作成：

**バケット1: avatars**
- Name: `avatars`
- Public bucket: ✅ チェック
- File size limit: 5MB
- Allowed MIME types: `image/*`

**バケット2: post-images**
- Name: `post-images`
- Public bucket: ✅ チェック
- File size limit: 5MB
- Allowed MIME types: `image/*`

### ステップ3: Storageポリシーの設定

1. SQL Editorに戻る
2. `storage-policies.sql` の内容をコピー＆ペースト
3. **Run** ボタンをクリックして実行

---

## 🔐 OAuth設定

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. **APIs & Services** > **Credentials** に移動
4. **Create Credentials** > **OAuth client ID** を選択
5. Application type: **Web application**
6. Authorized redirect URIs に追加：
   ```
   https://pamfltdnxchmojdodeoe.supabase.co/auth/v1/callback
   ```
7. Client ID と Client Secret をコピー

8. Supabase Dashboardで設定：
   - **Authentication** > **Providers** > **Google** を選択
   - Client ID と Client Secret を入力
   - **Save** をクリック

### Twitter OAuth

1. [Twitter Developer Portal](https://developer.twitter.com/) にアクセス
2. アプリを作成
3. **User authentication settings** を設定：
   - App permissions: **Read and write**
   - Type of App: **Web App**
   - Callback URL:
     ```
     https://pamfltdnxchmojdodeoe.supabase.co/auth/v1/callback
     ```
4. API Key と API Secret をコピー

5. Supabase Dashboardで設定：
   - **Authentication** > **Providers** > **Twitter** を選択
   - API Key と API Secret を入力
   - **Save** をクリック

---

## 🚀 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3001 にアクセス

---

## 📱 実装済み機能

### ✅ 認証機能
- メール/パスワード認証
- Google OAuth
- Twitter OAuth
- プロフィール自動作成

### ✅ 投稿機能
- テキスト投稿（最大500文字）
- 画像投稿（最大5枚）
- 画像圧縮・クロップ
- 投稿編集・削除

### ✅ タイムライン機能
- 無限スクロール
- 仮想スクロール対応
- リアルタイム更新

### ✅ インタラクション機能
- いいね
- コメント
- リポスト
- リアクション（絵文字）

### ✅ プロフィール機能
- プロフィール表示
- プロフィール編集
- アバター画像アップロード
- フォロー/フォロワー

### ✅ 通知機能
- いいね通知
- コメント通知
- リポスト通知
- フォロー通知
- 未読バッジ表示

### ✅ 検索機能
- ユーザー検索
- 投稿検索
- デバウンス対応

### ✅ ナビゲーション
- モバイル用ボトムナビゲーション
- デスクトップ用サイドバー
- アクティブルートハイライト

---

## 🚢 デプロイ（Vercel）

### 前提条件
- Vercelアカウント
- GitHubにリポジトリをpush済み

### デプロイ手順

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **Add New** > **Project** を選択
3. GitHubリポジトリを選択
4. **Environment Variables** を設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://pamfltdnxchmojdodeoe.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   NEXT_PUBLIC_APP_URL=<your-vercel-url>
   ```
5. **Deploy** をクリック

### デプロイ後の設定

1. Supabase Dashboardで認証設定を更新：
   - **Authentication** > **URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs に追加:
     ```
     https://your-app.vercel.app/auth/callback
     ```

2. Google Cloud Console / Twitter Developer Portalで：
   - Authorized redirect URIs を更新
   - 本番環境のURLを追加

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 16** - React フレームワーク
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS 4** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **Radix UI** - ヘッドレスUI

### 状態管理・データフェッチ
- **TanStack Query** - サーバーステート管理
- **Zustand** - クライアントステート管理
- **React Hook Form** - フォーム管理
- **Zod** - バリデーション

### バックエンド・インフラ
- **Supabase** - PostgreSQL, Auth, Storage, Realtime
- **Vercel** - ホスティング・デプロイ
- **Vercel Analytics** - パフォーマンス分析

### 画像処理・UI
- **browser-image-compression** - 画像圧縮
- **react-easy-crop** - 画像クロップ
- **Framer Motion** - アニメーション
- **date-fns** - 日付フォーマット
- **Sonner** - トースト通知

---

## 📝 開発時のヒント

### デバッグ

React Query DevToolsは開発環境で自動的に有効になります。

### ホットリロード

ファイルを保存すると自動的にブラウザが更新されます。

### TypeScript型チェック

```bash
npm run build
```

### Lint

```bash
npm run lint
```

---

## 🔒 セキュリティ

- Row Level Security (RLS) がすべてのテーブルで有効
- 認証必須のエンドポイントはミドルウェアで保護
- 環境変数は`.env.local`で管理（Gitにコミットしない）
- XSS/CSRF対策済み

---

## 📞 サポート

問題が発生した場合：

1. 開発サーバーのログを確認
2. ブラウザのコンソールを確認
3. Supabaseダッシュボードでログを確認

---

## 🎉 完成！

これでDolphins Private SNSの完全なセットアップが完了しました！

アプリケーションを楽しんでください！ 🐬
