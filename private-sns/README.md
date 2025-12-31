# Private SNS

完全プライベートなSNSアプリケーション

## 特徴

- ✍️ テキスト・画像投稿（複数枚対応）
- ❤️ いいね機能
- 💬 コメント機能
- 🔄 リポスト/シェア機能
- 😊 絵文字リアクション
- 🔐 シンプルな認証

## 技術スタック

- **Frontend**: Vue.js 3 + TypeScript + Tailwind CSS
- **Backend**: Supabase
- **Database**: PostgreSQL (Supabase)

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 新規プロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 2. 環境変数の設定

```bash
cd frontend
cp .env.example .env
```

`.env`ファイルに以下を設定：

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. データベーススキーマのセットアップ

Supabaseダッシュボードの「SQL Editor」で以下を実行：

```sql
-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿テーブル
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿画像テーブル
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいねテーブル
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- コメントテーブル
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- リポストテーブル
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 絵文字リアクションテーブル
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

-- インデックス
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 投稿のポリシー
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 投稿画像のポリシー
CREATE POLICY "Post images are viewable by everyone" ON post_images FOR SELECT USING (true);
CREATE POLICY "Users can create post images" ON post_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid())
);

-- いいねのポリシー
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- コメントのポリシー
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- リポストのポリシー
CREATE POLICY "Reposts are viewable by everyone" ON reposts FOR SELECT USING (true);
CREATE POLICY "Users can create own reposts" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reposts" ON reposts FOR DELETE USING (auth.uid() = user_id);

-- 絵文字リアクションのポリシー
CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create own reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);
```

### 4. ストレージバケットの作成

Supabaseダッシュボードの「Storage」で：

1. `post-images`という名前の新しいバケットを作成
2. バケットをpublicに設定

### 5. アプリケーションの起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く

## プロジェクト構造

```
private-sns/
├── frontend/
│   ├── src/
│   │   ├── components/     # Vueコンポーネント
│   │   ├── views/          # ページコンポーネント
│   │   ├── stores/         # Pinia stores
│   │   ├── lib/            # Supabase client等
│   │   ├── types/          # TypeScript型定義
│   │   └── router/         # Vue Router設定
│   └── ...
└── README.md
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# Lint
npm run lint
```

## ライセンス

MIT
