import { useState, useEffect } from 'react'

/**
 * スプラッシュスクリーンの表示状態を管理するカスタムフック
 * @param minimumTime 最低表示時間 (ms)
 * @param fadeOutTime フェードアウトにかける時間 (ms)
 * @returns { isVisible, isExiting }
 */
export function useSplashScreen(minimumTime = 2000, fadeOutTime = 500) {
    const [isVisible, setIsVisible] = useState(true)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        // 並行して実行される非同期処理（例：Auth初期化、データフェッチなど）
        const initializeApp = async () => {
            // 実際にはここでAPIを叩いたりステートを確認したりする
            // 今回はシミュレート用に少し待機
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 最低表示時間と初期化処理を並行して実行
        const timerPromise = new Promise(resolve => setTimeout(resolve, minimumTime))
        const initPromise = initializeApp()

        Promise.all([timerPromise, initPromise]).then(() => {
            setIsExiting(true)

            // フェードアウト完了後にコンポーネントを完全に消去
            setTimeout(() => {
                setIsVisible(false)
            }, fadeOutTime)
        })
    }, [minimumTime, fadeOutTime])

    return { isVisible, isExiting }
}
