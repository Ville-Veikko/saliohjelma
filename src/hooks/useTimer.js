import { useState, useRef, useEffect, useCallback } from 'react'

function pingAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
    osc.onended = () => ctx.close()
  } catch {}
}

function sendNotification() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('Lepo ohi!', { body: 'Seuraava setti odottaa.' })
  }
}

export function useTimer(totalSeconds) {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  // Pyydä notifikaatiolupa heti käynnistyksessä
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Siivotaan intervalli unmountissa
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const start = useCallback(() => {
    clearInterval(intervalRef.current)
    setRemaining(totalSeconds)
    setRunning(true)
    setDone(false)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setDone(true)
          pingAudio()
          sendNotification()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [totalSeconds])

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

  return { remaining, total: totalSeconds, running, done, visible, start, skip, dismiss }
}
