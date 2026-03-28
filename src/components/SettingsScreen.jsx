import React, { useState } from 'react'
import { saveBodyweight, saveTimerDuration } from '../utils/storage'

const TIMER_MIN = 30
const TIMER_MAX = 300
const TIMER_STEP = 15

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function SettingsScreen({
  bodyweight,
  onBodyweightChange,
  timerDuration,
  onTimerDurationChange,
}) {
  const [input, setInput] = useState(bodyweight != null ? String(bodyweight) : '')
  const [savedMsg, setSavedMsg] = useState(false)

  function handleSave() {
    const kg = parseFloat(input.replace(',', '.'))
    if (!kg || kg < 30 || kg > 250) return
    saveBodyweight(kg)
    onBodyweightChange(kg)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSave()
  }

  function handleTimerChange(delta) {
    const next = Math.min(TIMER_MAX, Math.max(TIMER_MIN, timerDuration + delta))
    saveTimerDuration(next)
    onTimerDurationChange(next)
  }

  return (
    <div className="screen">
      <div className="settings-header">
        <div className="screen-title">Asetukset</div>
        <div className="screen-sub">Tallennetaan paikallisesti puhelimelle</div>
      </div>

      <div className="settings-field">
        <label className="settings-label" htmlFor="bw-input">
          Kehonpaino (kg)
        </label>
        <input
          id="bw-input"
          className="settings-input"
          type="number"
          inputMode="decimal"
          placeholder="esim. 85"
          value={input}
          onChange={e => { setInput(e.target.value); setSavedMsg(false) }}
          onKeyDown={handleKey}
          min="30"
          max="250"
          step="0.5"
        />
      </div>

      <button className="settings-save" onClick={handleSave}>
        Tallenna
      </button>
      <div className="settings-saved">
        {savedMsg ? '✓ Tallennettu!' : ''}
      </div>

      <div className="settings-info">
        Kehonpaino tarvitaan leuanvetojen Epley-laskentaan (lisäpaino + kehonpaino = kokonaispaino).
        Arvo tallennetaan ainoastaan tähän laitteeseen — ei lähetetä minnekään.
      </div>

      {/* Lepoaika */}
      <div className="settings-field" style={{ marginTop: 32 }}>
        <div className="settings-label">Lepoaika</div>
        <div className="timer-dur-row">
          <button
            className="timer-dur-btn"
            onClick={() => handleTimerChange(-TIMER_STEP)}
            disabled={timerDuration <= TIMER_MIN}
          >
            −
          </button>
          <div className="timer-dur-val">{formatDuration(timerDuration)}</div>
          <button
            className="timer-dur-btn"
            onClick={() => handleTimerChange(TIMER_STEP)}
            disabled={timerDuration >= TIMER_MAX}
          >
            +
          </button>
        </div>
      </div>

      <div className="settings-info">
        Lepotauko settien välillä. Muutos astuu voimaan seuraavasta treenistä.
        Tallennetaan paikallisesti.
      </div>
    </div>
  )
}
