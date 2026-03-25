import React, { useState } from 'react'
import { epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'

export default function SummaryScreen({ program, workout, bodyweight, onSaved }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!workout) return null

  const { week, day, results } = workout
  const weekData = program.weeks[week]
  const exercises = program.days[day]

  function buildRows() {
    return exercises.map((ex, i) => {
      const r = results[i]
      const kgRaw = ex.kg[week]
      const kgNum = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0

      const doneSets = r.sets.filter(v => v != null)
      const epleys = doneSets.map(v => epley(kgNum, v)).filter(Boolean)
      const best1rm = epleys.length ? Math.max(...epleys) : null

      const setsStr = doneSets.length ? doneSets.join(' / ') : '—'
      const boStr = r.bo != null ? ` · bo: ${r.bo}` : ''
      const detail = `${kgRaw} kg · ${setsStr}${boStr}`

      return { name: ex.name, detail, best1rm }
    })
  }

  function buildPayload() {
    const tulokset = exercises.map((ex, i) => {
      const r = results[i]
      const numSets = getSetCount(program, week, ex)
      return {
        liike: ex.name,
        set1: r.sets[0] ?? null,
        set2: r.sets[1] ?? null,
        set3: numSets >= 3 ? (r.sets[2] ?? null) : null,
        set4: numSets >= 4 ? (r.sets[3] ?? null) : null,
        bo:   r.bo ?? null,
      }
    })
    return { viikko: week + 1, paiva: `Day ${day + 1}`, tulokset }
  }

  function handleSave() {
    if (saved || saving) return
    setSaving(true)
    const data = buildPayload()
    const encoded = encodeURIComponent(JSON.stringify(data))
    window.open(`${program.sheetsUrl}?data=${encoded}`, '_blank')
    // Merkitään tallennetuksi välittömästi — käyttäjä tarkistaa Sheetsistä
    setSaved(true)
    setSaving(false)
    onSaved?.()
  }

  const rows = buildRows()

  return (
    <div className="screen">
      <div className="screen-title">Päivän yhteenveto</div>
      <div className="screen-sub">
        Päivä {day + 1} · Viikko {week + 1} · RIR {weekData.rir}
      </div>

      {rows.map((row, i) => (
        <div key={i} className="sum-row">
          <div>
            <div className="sum-liike">{row.name}</div>
            <div className="sum-detail">{row.detail}</div>
          </div>
          <div className="sum-epley">
            {row.best1rm ? `Paras 1RM: ${row.best1rm} kg` : '—'}
          </div>
        </div>
      ))}

      <button
        className={`save-btn${saved ? ' saved' : ''}`}
        onClick={handleSave}
        disabled={saved}
      >
        {saved ? '✓ Tallennettu!' : 'Tallenna Sheetsiin →'}
      </button>
      <div className={`save-status${saved ? ' ok' : ''}`}>
        {saved ? 'Tarkista Sheetsistä että luvut tallentuivat oikein' : ''}
      </div>
    </div>
  )
}
