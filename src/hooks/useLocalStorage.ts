import { useEffect, useState } from 'react'

/**
 * localStorage に永続化される state。
 * 初回読み込み時に localStorage から復元し、変更のたびに保存する。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 容量超過等は無視（メモリ上の state は維持される）
    }
  }, [key, value])

  return [value, setValue] as const
}
