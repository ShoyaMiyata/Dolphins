/**
 * Dolphins Project - UI Theme Configuration
 *
 * このファイルは、Dolphinsプロジェクト全体で使用する統一UIテーマを定義します。
 * ランディングページのデザインを基準としています。
 *
 * Usage:
 * - Tailwind CSS設定で使用
 * - CSS変数として各フレームワークで参照可能
 * - デザインシステムの中心的な設定ファイル
 */

export const colors = {
  dolphin: {
    blue: '#0055AA',      // Royal Blue - メインブランドカラー
    light: '#4DA6FF',     // Sky Blue - アクセント、ホバー
    dark: '#003366',      // Dark Blue - 深い背景、フッター
    orange: '#FF8800',    // Basketball Orange - アクションボタン
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    800: '#1F2937',
    900: '#111827',
  },
  blue: {
    100: '#DBEAFE',
  },
  white: '#FFFFFF',
  black: '#000000',
};

export const fontFamily = {
  sans: ['"Noto Sans JP"', 'system-ui', '-apple-system', 'sans-serif'],
  display: ['"Anton"', 'sans-serif'],
};

export const fontSize = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
  '7xl': '4.5rem',    // 72px
};

export const spacing = {
  section: {
    mobile: '4rem',     // 64px
    tablet: '6rem',     // 96px
  },
  container: {
    padding: '1rem',    // 16px
  },
  card: {
    padding: '2rem',    // 32px
  },
  gap: {
    sm: '1rem',         // 16px
    md: '2rem',         // 32px
    lg: '3rem',         // 48px
  },
};

export const borderRadius = {
  sm: '0.375rem',       // 6px
  md: '0.5rem',         // 8px
  lg: '1rem',           // 16px
  xl: '1.5rem',         // 24px
  '2xl': '2rem',        // 32px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
  slow: 'all 0.5s ease',
};

// Tailwind CSS config用のエクスポート
export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        dolphin: colors.dolphin,
      },
      fontFamily,
      spacing: {
        'section-mobile': spacing.section.mobile,
        'section-tablet': spacing.section.tablet,
      },
      borderRadius: {
        '2xl': borderRadius['2xl'],
      },
      boxShadow: shadows,
    },
  },
};

// CSS変数として使用する場合の設定
export const cssVariables = {
  '--color-dolphin-blue': colors.dolphin.blue,
  '--color-dolphin-light': colors.dolphin.light,
  '--color-dolphin-dark': colors.dolphin.dark,
  '--color-dolphin-orange': colors.dolphin.orange,
  '--color-gray-50': colors.gray[50],
  '--color-gray-800': colors.gray[800],
  '--font-sans': fontFamily.sans.join(', '),
  '--font-display': fontFamily.display.join(', '),
  '--transition-default': transitions.default,
  '--border-radius-lg': borderRadius.lg,
  '--border-radius-full': borderRadius.full,
  '--spacing-section-mobile': spacing.section.mobile,
  '--spacing-section-tablet': spacing.section.tablet,
};

// Vue.js / Nuxt.js用のカラープリセット
export const vueColorPreset = {
  primary: colors.dolphin.blue,
  secondary: colors.dolphin.light,
  accent: colors.dolphin.orange,
  background: colors.gray[50],
  text: colors.gray[800],
};

// React / Next.js用のテーマオブジェクト
export const reactTheme = {
  colors,
  fontFamily,
  fontSize,
  spacing,
  borderRadius,
  shadows,
  transitions,
};

export default {
  colors,
  fontFamily,
  fontSize,
  spacing,
  borderRadius,
  shadows,
  transitions,
  tailwindConfig,
  cssVariables,
  vueColorPreset,
  reactTheme,
};
