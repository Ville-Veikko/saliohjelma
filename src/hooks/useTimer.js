import { useState, useRef, useEffect, useCallback } from 'react'

function pingAudio(audioCtx) {
  if (!audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.35)
  } catch (e) {
    console.warn('Audio ping epäonnistui:', e)
  }
}

function sendNotification() {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Lepo ohi!', { body: 'Seuraava setti odottaa.' })
    }
  } catch (e) {
    console.warn('Notifikaatio epäonnistui:', e)
  }
}

export function useTimer(totalSeconds) {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)
  // AudioContext luodaan start()-kutsussa (käyttäjän interaktio) ja säilytetään ref:ssä
  const audioCtxRef = useRef(null)

  // Pyydä notifikaatiolupa heti käynnistyksessä
  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } catch (e) {
      console.warn('Notification.requestPermission epäonnistui:', e)
    }
  }, [])

  // Siivotaan intervalli unmountissa
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const start = useCallback(() => {
    clearInterval(intervalRef.current)
    setRemaining(totalSeconds)
    setRunning(true)
    setDone(false)

    // Luo AudioContext käyttäjän interaktion aikana (selaimen vaatimus)
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    } catch (e) {
      console.warn('AudioContext luonti epäonnistui:', e)
      audioCtxRef.current = null
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setDone(true)
          pingAudio(audioCtxRef.current)
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
