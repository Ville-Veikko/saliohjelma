import { useState, useRef, useEffect, useCallback } from 'react'

const TOTAL_SECONDS = 120

export function useTimer() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  // Siivotaan intervalli unmountissa
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const start = useCallback(() => {
    clearInterval(intervalRef.current)
    setRemaining(TOTAL_SECONDS)
    setRunning(true)
    setDone(false)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const skip = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setDone(false)
    setRemaining(0)
  }, [])

  const dismiss = useCallback(() => {
    setDone(false)
  }, [])

  const visible = running || done

  return { remaining, total: TOTAL_SECONDS, running, done, visible, start, skip, dismiss }
}
