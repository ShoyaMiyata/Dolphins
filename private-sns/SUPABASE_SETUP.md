# Supabaseセットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインイン
4. 「New project」をクリック
5. 以下を入力：
   - **Name**: private-sns（または任意の名前）
   - **Database Password**: 強力なパスワードを生成・保存
   - **Region**: Tokyo (Northeast Asia)を選択
6. 「Create new project」をクリック（数分待つ）

## 2. データベーススキーマの作成

プロジェクトが作成されたら：

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLをコピー&ペースト：

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

-- ユーザー登録時に自動でprofilesを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. 「Run」をクリック（緑のボタン）
5. 成功メッセージを確認

## 3. ストレージバケットの作成

### 3-1. バケットを作成

1. 左サイドバーの「Storage」をクリック
2. 「New bucket」をクリック
3. 以下を入力：
   - **Name**: `post-images`
   - **Public bucket**: **ONにする**（重要！）
4. 「Create bucket」をクリック

### 3-2. ストレージポリシーの追加

ストレージポリシーは**必ず追加が必要**です。ポリシーがないと画像のアップロードや閲覧ができません。

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLをコピー&ペースト：

```sql
-- 画像のアップロード（認証済みユーザーのみ）
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- 画像の閲覧（全員）
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- 画像の削除（所有者のみ）
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

4. 「Run」ボタン（緑色）をクリック
5. 成功メッセージが表示されればOK

### 3-3. ポリシーが正しく設定されたか確認

1. 「Storage」→「post-images」→「Policies」タブを開く
2. 以下の3つのポリシーが表示されていればOK：
   - ✅ Authenticated users can upload images (INSERT)
   - ✅ Anyone can view images (SELECT)
   - ✅ Users can delete own images (DELETE)

## 4. 認証設定

### 4-1. Email認証の設定

1. 左サイドバーの「Authentication」をクリック
2. 「Providers」タブをクリック
3. 「Email」が有効（Enabled）になっていることを確認
   - デフォルトで有効になっています
   - 「Confirm email」がONの場合、ユーザー登録時にメール確認が必要になります

### 4-2. Google認証の設定

#### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 左上のメニュー → 「APIとサービス」 → 「認証情報」をクリック
4. 「認証情報を作成」 → 「OAuth クライアント ID」をクリック
5. 「同意画面を設定」をクリック（初回のみ）
   - **User Type**: External を選択
   - 「作成」をクリック
6. OAuth同意画面を設定：
   - **アプリ名**: `Private SNS`（任意の名前）
   - **ユーザーサポートメール**: 自分のメールアドレス
   - **デベロッパーの連絡先情報**: 自分のメールアドレス
   - 「保存して次へ」をクリック
7. スコープは設定不要 → 「保存して次へ」をクリック
8. テストユーザーは設定不要 → 「保存して次へ」をクリック
9. 再度「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
10. 以下を入力：
    - **アプリケーションの種類**: ウェブ アプリケーション
    - **名前**: `Private SNS Web Client`（任意の名前）
    - **承認済みのリダイレクト URI**:
      ```
      https://<your-project-ref>.supabase.co/auth/v1/callback
      ```
      ※ `<your-project-ref>`は自分のSupabaseプロジェクトのURL（例: `abcdefgh`）
11. 「作成」をクリック
12. **クライアント ID** と **クライアント シークレット** をコピー

#### Supabaseでの設定

1. Supabaseダッシュボードに戻る
2. 「Authentication」 → 「Providers」 → 「Google」をクリック
3. 「Enable Sign in with Google」をONにする
4. Google Cloud Consoleでコピーした情報を入力：
   - **Client ID**: Google Cloud ConsoleのクライアントID
   - **Client Secret**: Google Cloud Consoleのクライアントシークレット
5. 「Save」をクリック

### 4-3. X (Twitter) 認証の設定

#### X Developer Portalでの設定

1. [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)にアクセス
2. Xアカウントでログイン
3. 「+ Create Project」をクリック（または既存のプロジェクトを選択）
4. プロジェクト情報を入力：
   - **Project name**: `Private SNS`（任意の名前）
   - **Use case**: 「Making a bot」など適当に選択
   - 「Next」をクリック
5. アプリを作成：
   - **App name**: `Private SNS App`（任意の名前）
   - 「Next」をクリック
6. **API Key** と **API Key Secret** が表示される
   - この時点では使わないので「App settings」をクリック
7. 「User authentication settings」 → 「Set up」をクリック
8. 以下を設定：
   - **App permissions**: Read を選択
   - **Type of App**: Web App を選択
   - **App info**:
     - **Callback URI / Redirect URL**:
       ```
       https://<your-project-ref>.supabase.co/auth/v1/callback
       ```
       ※ `<your-project-ref>`は自分のSupabaseプロジェクトのURL
     - **Website URL**: `http://localhost:5173`（開発時のURL）
9. 「Save」をクリック
10. **Client ID** と **Client Secret** が表示される
    - この2つをコピーして保存

#### Supabaseでの設定

1. Supabaseダッシュボードに戻る
2. 「Authentication」 → 「Providers」 → 「Twitter」をクリック
3. 「Enable Sign in with Twitter」をONにする
4. X Developer Portalでコピーした情報を入力：
   - **Client ID**: X Developer PortalのClient ID
   - **Client Secret**: X Developer PortalのClient Secret
5. 「Save」をクリック

### 4-4. 設定完了の確認

1. 「Authentication」 → 「Providers」タブを開く
2. 以下が有効（Enabled）になっていればOK：
   - ✅ Email
   - ✅ Google
   - ✅ Twitter

### 認証プロバイダーの役割

| プロバイダー | 用途 | メリット |
|------------|------|---------|
| Email | メール/パスワードでログイン | シンプル、誰でも使える |
| Google | Googleアカウントでログイン | ユーザーが新規登録不要 |
| Twitter (X) | Xアカウントでログイン | SNS連携、使い慣れたアカウント |

## 5. APIキーの取得

1. 左サイドバーの「Project Settings」（歯車アイコン）をクリック
2. 「API」タブをクリック
3. 以下をコピー：
   - **Project URL** (例: https://xxxxx.supabase.co)
   - **anon public** キー

## 6. フロントエンドの環境変数設定

1. `frontend/.env`ファイルを作成
2. 以下を貼り付け（値は自分のものに置き換え）：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 完了！

これでSupabaseのセットアップは完了です。
アプリケーションを起動して動作を確認してください：

```bash
cd frontend
npm run dev
```

## トラブルシューティング

### RLSエラーが出る場合
- Supabaseダッシュボードの「SQL Editor」でポリシーが正しく設定されているか確認
- ユーザーが認証済みか確認

### 画像アップロードができない場合
- ストレージバケットが正しく作成されているか確認
- バケット名が`post-images`になっているか確認
- ストレージポリシーが正しく設定されているか確認

### 接続エラーが出る場合
- `.env`ファイルのURLとキーが正しいか確認
- Supabaseプロジェクトが起動しているか確認
