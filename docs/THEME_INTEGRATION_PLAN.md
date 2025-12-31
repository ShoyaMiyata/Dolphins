# Dolphins プロジェクト テーマ統合計画書

## 概要

このドキュメントでは、Dolphinsランディングページのデザインテーマを既存プロジェクトに適用する統合計画を説明します。

**目標**: 全プロジェクトで統一されたブランドアイデンティティとUI/UXを実現する

## プロジェクト構成

### 1. ランディングページ（基準デザイン）
- **パス**: `/landing-page/`
- **技術スタック**: React 19 + Vite + Tailwind CSS (CDN)
- **ステータス**: ✅ 完成（デザインの基準）

### 2. Private SNS（Vue.js版）
- **パス**: `/private-sns/frontend/`
- **技術スタック**: Vue 3 + Vite + Tailwind CSS 4 + Pinia
- **ステータス**: 🔄 開発中（テーマ適用対象）

### 3. Private SNS v2（Next.js版）
- **パス**: `/private-sns-v2/`
- **技術スタック**: Next.js 16 + React 19 + Tailwind CSS 4
- **ステータス**: 🔄 開発中（テーマ適用対象）

## テーマアセット

以下のファイルが作成済み：

- **`/docs/DESIGN_THEME.md`**: デザインシステム仕様書
- **`/theme.config.js`**: テーマ設定（JS/TS用）
- **`/theme.css`**: グローバルスタイル（CSS変数・ユーティリティクラス）

## 統合ステップ

### Phase 1: Private SNS（Vue.js版）へのテーマ適用

#### 1.1 Tailwind設定の更新

**ファイル**: `/private-sns/frontend/tailwind.config.js`（または `tailwind.config.ts`）

```javascript
import { tailwindConfig } from '../../theme.config.js';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ...tailwindConfig.theme.extend,
    },
  },
  plugins: [],
};
```

#### 1.2 グローバルCSSの追加

**ファイル**: `/private-sns/frontend/src/assets/main.css`

```css
/* Dolphins Theme Import */
@import '../../../theme.css';

/* プロジェクト固有のスタイル */
/* ... */
```

**または** `/private-sns/frontend/src/main.ts` で直接インポート:

```typescript
import '../../theme.css';
import './assets/main.css';
```

#### 1.3 フォントの追加

**ファイル**: `/private-sns/frontend/index.html`

```html
<head>
  <!-- ... -->
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
</head>
```

#### 1.4 Vue Composableの作成（オプション）

**ファイル**: `/private-sns/frontend/src/composables/useTheme.ts`

```typescript
import { reactive } from 'vue';
import theme from '../../../theme.config.js';

export function useTheme() {
  const colors = reactive(theme.colors);
  const spacing = reactive(theme.spacing);

  return {
    colors,
    spacing,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
  };
}
```

#### 1.5 既存コンポーネントの段階的移行

**優先順位**:
1. **ヘッダー/ナビゲーション**: `dolphin-blue` 背景、白テキスト
2. **ボタン**: `.btn-primary`, `.btn-secondary` クラス適用
3. **カード**: `.card` クラス、`rounded-2xl` + `shadow-lg`
4. **フォーム**: Dolphinカラーパレット使用
5. **フッター**: `dolphin-dark` 背景

**作業例**:
```vue
<!-- Before -->
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  送信
</button>

<!-- After -->
<button class="btn btn-primary">
  送信
</button>
```

---

### Phase 2: Private SNS v2（Next.js版）へのテーマ適用

#### 2.1 Tailwind設定の更新

**ファイル**: `/private-sns-v2/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import { tailwindConfig } from '../theme.config.js';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      ...tailwindConfig.theme.extend,
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

#### 2.2 グローバルCSSの更新

**ファイル**: `/private-sns-v2/app/globals.css`

```css
@import '../theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* プロジェクト固有のスタイル */
/* ... */
```

#### 2.3 フォントの追加

**ファイル**: `/private-sns-v2/app/layout.tsx`

```typescript
import { Noto_Sans_JP, Anton } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

#### 2.4 React Hookの作成（オプション）

**ファイル**: `/private-sns-v2/hooks/useTheme.ts`

```typescript
import { useMemo } from 'react';
import theme from '../../theme.config.js';

export function useTheme() {
  return useMemo(() => ({
    colors: theme.colors,
    spacing: theme.spacing,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
  }), []);
}
```

#### 2.5 shadcn/ui コンポーネントのカスタマイズ

**ファイル**: `/private-sns-v2/components/ui/button.tsx`

```typescript
// 既存のVariantsに加えて、Dolphinテーマのバリアントを追加
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-dolphin-blue text-white hover:bg-dolphin-light",
        primary: "bg-dolphin-orange text-white hover:bg-orange-600",
        // ... 既存のバリアント
      },
    },
  }
);
```

---

### Phase 3: 共通コンポーネントライブラリ（オプション）

将来的に両プロジェクトで共有可能なコンポーネントライブラリを検討：

**構成案**:
```
/Dolphins
  /shared-ui
    /components
      /Button
      /Card
      /Badge
      /...
    /theme
      - colors.ts
      - typography.ts
      - spacing.ts
    package.json
```

**メリット**:
- デザイン統一性の向上
- 重複コード削減
- メンテナンス性向上

---

## 実装チェックリスト

### Private SNS（Vue.js版）

- [ ] Tailwind設定にテーマ適用
- [ ] グローバルCSS追加
- [ ] Googleフォント追加
- [ ] ヘッダーコンポーネント更新
- [ ] ボタンコンポーネント更新
- [ ] カードコンポーネント更新
- [ ] フォームコンポーネント更新
- [ ] フッターコンポーネント更新
- [ ] 既存カラースキームの置き換え
- [ ] レスポンシブ確認

### Private SNS v2（Next.js版）

- [ ] Tailwind設定にテーマ適用
- [ ] グローバルCSS更新
- [ ] Next.js Fonts設定
- [ ] shadcn/ui コンポーネントカスタマイズ
- [ ] ヘッダーコンポーネント更新
- [ ] ボタンコンポーネント更新
- [ ] カードコンポーネント更新
- [ ] フォームコンポーネント更新
- [ ] フッターコンポーネント更新
- [ ] 既存カラースキームの置き換え
- [ ] レスポンシブ確認

---

## カラー移行マッピング

既存プロジェクトでよく使われる色をDolphinテーマに置き換える際のガイド：

| 既存カラー | Dolphinテーマ | 用途 |
|-----------|--------------|------|
| `blue-500` | `dolphin-blue` | プライマリアクション |
| `blue-600` | `dolphin-dark` | プライマリホバー/フォーカス |
| `sky-400` | `dolphin-light` | セカンダリアクセント |
| `orange-500` | `dolphin-orange` | CTAボタン、重要アクション |
| `gray-50` | `gray-50` | 背景色 |
| `gray-800` | `gray-800` | テキスト本文 |

**検索・置換例（正規表現）**:
```
bg-blue-500 → bg-dolphin-blue
text-blue-600 → text-dolphin-blue
hover:bg-blue-600 → hover:bg-dolphin-light
```

---

## テスト計画

### ビジュアル回帰テスト
- [ ] ヘッダー/ナビゲーション
- [ ] 各種ボタンスタイル
- [ ] カードレイアウト
- [ ] フォーム要素
- [ ] モーダル/ダイアログ
- [ ] モバイルビュー

### ブラウザ互換性
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] iOS Safari
- [ ] Android Chrome

### アクセシビリティ
- [ ] カラーコントラスト比（WCAG AA準拠）
- [ ] キーボードナビゲーション
- [ ] スクリーンリーダー対応

---

## タイムライン（目安）

| Phase | 期間 | 作業内容 |
|-------|------|---------|
| Phase 1 | 1-2週間 | Vue.js版へのテーマ適用 |
| Phase 2 | 1-2週間 | Next.js版へのテーマ適用 |
| Phase 3 | 2-3週間 | 共通コンポーネントライブラリ構築（オプション） |

**合計**: 約4-7週間

---

## リファレンス

- **デザインシステム仕様**: `/docs/DESIGN_THEME.md`
- **テーマ設定**: `/theme.config.js`
- **グローバルスタイル**: `/theme.css`
- **ランディングページ**: `/landing-page/`
- **Tailwind CSS公式**: https://tailwindcss.com/
- **Vue 3公式**: https://vuejs.org/
- **Next.js公式**: https://nextjs.org/

---

## 問い合わせ・サポート

テーマ統合に関する質問や問題があれば、プロジェクトのドキュメントを参照するか、開発チームに相談してください。

**最終更新**: 2025-12-30
