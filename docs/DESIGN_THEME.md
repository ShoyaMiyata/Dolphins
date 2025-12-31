# Dolphins プロジェクト デザインテーマ

このドキュメントでは、Dolphinsプロジェクト全体で使用するデザインテーマとスタイルガイドを定義します。
ランディングページ (`landing-page/`) のデザインを基準としています。

## カラーパレット

### メインカラー

| 色名 | カラーコード | 用途 |
|------|------------|------|
| **Dolphin Blue** | `#0055AA` | メインブランドカラー、ヘッダー、CTA |
| **Dolphin Light** | `#4DA6FF` | アクセント、ホバーステート |
| **Dolphin Dark** | `#003366` | 深い背景、フッター |
| **Dolphin Orange** | `#FF8800` | アクションボタン、強調要素（バスケットボールカラー） |

### システムカラー

| 色名 | カラーコード | 用途 |
|------|------------|------|
| Gray 50 | `#F9FAFB` | 背景色 |
| Gray 800 | `#1F2937` | テキスト本文 |
| White | `#FFFFFF` | コンテンツ背景 |
| Blue 100 | `#DBEAFE` | 薄いテキストカラー（Heroセクション等） |

### グラデーション

- **Heroグラデーション**: `from-dolphin-blue via-dolphin-dark to-black` + `opacity-90`
- **Radialグラデーション**: `radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)`

## タイポグラフィ

### フォントファミリー

- **メインフォント**: `Noto Sans JP` (日本語対応)
  - Regular (400)
  - Medium (500)
  - Bold (700)

- **ディスプレイフォント**: `Anton` (見出し・タイトル用)
  - 英字大文字使用推奨
  - `uppercase`, `tracking-tight` との組み合わせ

### フォントサイズ階層

| 要素 | サイズ (Mobile) | サイズ (Tablet) | サイズ (Desktop) |
|------|----------------|----------------|-----------------|
| h1 (Hero) | 2.25rem (36px) | 3.75rem (60px) | 4.5rem (72px) |
| h2 (Section) | 1.875rem (30px) | 2.25rem (36px) | 3rem (48px) |
| Body Text | 1rem (16px) | 1.125rem (18px) | 1.125rem (18px) |
| Small Text | 0.875rem (14px) | 0.875rem (14px) | 0.875rem (14px) |

## スペーシング

### セクション間隔

- **大**: `py-16` (4rem / 64px) - Mobile
- **大**: `md:py-24` (6rem / 96px) - Tablet以上
- **中**: `py-12` (3rem / 48px)
- **小**: `py-8` (2rem / 32px)

### コンテナ

- **最大幅**: `container mx-auto` (デフォルト)
- **パディング**: `px-4` (1rem / 16px)
- **中央寄せ**: `mx-auto text-center`

## コンポーネントスタイル

### ボタン

#### プライマリボタン
```css
bg-dolphin-orange
hover:bg-orange-600
text-white
rounded-full
px-8 py-4
font-bold text-lg
transition-all
transform hover:-translate-y-1
shadow-lg hover:shadow-orange-500/50
```

#### セカンダリボタン
```css
bg-white/10
hover:bg-white/20
backdrop-blur-md
text-white
border border-white/30
rounded-full
px-8 py-4
font-bold text-lg
transition-all
```

### カード

```css
bg-white
rounded-2xl
shadow-lg
hover:shadow-2xl
p-8
transition-all
transform hover:-translate-y-2
```

### バッジ/タグ

```css
bg-dolphin-blue/10
text-dolphin-blue
px-4 py-2
rounded-full
text-sm font-medium
```

## アニメーション

### トランジション

- **標準**: `transition-all duration-300`
- **ホバーエフェクト**: `hover:-translate-y-1` または `hover:-translate-y-2`
- **影の変化**: `shadow-lg` → `hover:shadow-2xl`

### カスタムアニメーション

- **Fade In Up**: Heroセクションのバッジ
- **Bounce**: スクロールインジケーター (`animate-bounce`)
- **Pulse**: Heroバッジのグロー効果 (`animate-pulse`)

## レイアウト原則

### レスポンシブブレークポイント

- **Mobile First**: デフォルト (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `md:` (≥ 768px)
- **Large Desktop**: `lg:` (≥ 1024px)

### グリッド

- **2カラム**: `md:grid-cols-2`
- **3カラム**: `md:grid-cols-3`
- **4カラム**: `lg:grid-cols-4`
- **ギャップ**: `gap-8` (2rem / 32px)

## アイコン

- **ライブラリ**: `lucide-react`
- **サイズ**: 通常 `20px` または `24px`
- **カラー**: コンテキストに応じて継承

## 画像

### プレースホルダー

- **ロゴ（円形）**: `400x400px`, 背景 `#0055AA`, テキスト白
- **ロゴ（矩形）**: `600x150px`, 背景白, テキスト `#0055AA`

### スタイリング

- **円形ロゴ**: `rounded-full border-4 border-white shadow-2xl`
- **アスペクト比維持**: `object-cover`
- **背景色**: `bg-white` (透過PNG対策)

## 実装ガイドライン

### Tailwind CSS設定

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        dolphin: {
          blue: '#0055AA',
          light: '#4DA6FF',
          dark: '#003366',
          orange: '#FF8800',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        display: ['"Anton"', 'sans-serif'],
      }
    }
  }
}
```

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

## ベストプラクティス

1. **カラー使用**: メインアクションには `dolphin-orange`、信頼感には `dolphin-blue` を使用
2. **コントラスト**: アクセシビリティのため、テキストと背景のコントラスト比を4.5:1以上に保つ
3. **アニメーション**: ユーザー体験を損なわない範囲でサブトルに使用
4. **レスポンシブ**: モバイルファーストで設計、タブレット・デスクトップで拡張
5. **一貫性**: 同じ要素には常に同じスタイルを適用

## 参照

- ランディングページ実装: `/landing-page/`
- Tailwind CSS公式ドキュメント: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/
