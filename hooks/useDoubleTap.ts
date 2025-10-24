import { MutableRefObject, useCallback, useRef } from 'react'

export type DoubleTapHandlers = {
  onSingle?: () => void
  onDouble?: () => void
  delay?: number
}

export const useDoubleTap = ({ onSingle, onDouble, delay = 250 }: DoubleTapHandlers) => {
  const lastTapRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) as MutableRefObject<ReturnType<typeof setTimeout> | null>

  const handler = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < delay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      lastTapRef.current = 0
      onDouble?.()
    } else {
      lastTapRef.current = now
      if (onSingle) {
        timeoutRef.current = setTimeout(() => {
          onSingle?.()
          timeoutRef.current = null
        }, delay)
      }
    }
  }, [delay, onSingle, onDouble])

  return handler
}

export default useDoubleTap
