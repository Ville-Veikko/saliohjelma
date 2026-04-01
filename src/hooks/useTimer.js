import { useState, useRef, useEffect, useCallback } from 'react'

const TIMER_START_KEY = 'saliohjelma_timer_alku'

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

function startInterval(intervalRef, audioCtxRef, setRemaining, setRunning, setDone) {
  intervalRef.current = setInterval(() => {
    setRemaining(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current)
        setRunning(false)
        setDone(true)
        localStorage.removeItem(TIMER_START_KEY)
        pingAudio(audioCtxRef.current)
        sendNotification()
        return 0
      }
      return prev - 1
    })
  }, 1000)
}

export function useTimer(totalSeconds) {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Pyydä notifikaatiolupa
  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } catch (e) {
      console.warn('Notification.requestPermission epäonnistui:', e)
    }
  }, [])

  // Palauta taimerin tila uudelleenlatauksen jälkeen
  useEffect(() => {
    const raw = localStorage.getItem(TIMER_START_KEY)
    if (!raw) return
    try {
      const { startAt, totalSecs } = JSON.parse(raw)
      const elapsed = (Date.now() - startAt) / 1000
      const rem = Math.ceil(totalSecs - elapsed)
      if (rem <= 0) {
        // Aika on kulunut — näytä "Lepo ohi" suoraan
        localStorage.removeItem(TIMER_START_KEY)
        setDone(true)
      } else {
        // Taimeri vielä käynnissä — jatka laskentaa
        setRemaining(rem)
        setRunning(true)
        startInterval(intervalRef, audioCtxRef, setRemaining, setRunning, setDone)
      }
    } catch {
      localStorage.removeItem(TIMER_START_KEY)
    }
  }, []) // vain mount

  // Siivotaan intervalli unmountissa
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const start = useCallback(() => {
    clearInterval(intervalRef.current)
    setRemaining(totalSeconds)
    setRunning(true)
    setDone(false)

    // Tallenna käynnistysaika
    localStorage.setItem(TIMER_START_KEY, JSON.stringify({
      startAt: Date.now(),
      totalSecs: totalSeconds,
    }))

    // Luo AudioContext käyttäjän interaktion aikana
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

    startInterval(intervalRef, audioCtxRef, setRemaining, setRunning, setDone)
  }, [totalSeconds])

  const skip = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setDone(false)
    setRemaining(0)
    localStorage.removeItem(TIMER_START_KEY)
  }, [])

  const dismiss = useCallback(() => {
    setDone(false)
    localStorage.removeItem(TIMER_START_KEY)
  }, [])

  const visible = running || done

  return { remaining, total: totalSeconds, running, done, visible, start, skip, dismiss }
}
