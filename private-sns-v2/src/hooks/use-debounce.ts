import { useEffect, useState } from 'react'

/**
 * カスタムフック: 値をデバウンス処理する
 * @param value - デバウンスする値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 指定した遅延時間後に値を更新
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // クリーンアップ関数: 次の効果が実行される前にタイマーをクリア
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
