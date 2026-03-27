import React, { useState } from 'react'
import { saveBodyweight } from '../utils/storage'

export default function SettingsScreen({ bodyweight, onBodyweightChange }) {
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
    </div>
  )
}
