import React, { useState } from 'react'
import { epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'
import { loadWorkout } from '../utils/storage'

function buildRows(program, week, day, results, bodyweight) {
  const exercises = program.days[day]
  return exercises.map((ex, i) => {
    const r = results[i]
    if (!r) return { name: ex.name, detail: '—', best1rm: null }
    const kgRaw = ex.kg[week]
    const kgNum = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0
    const doneSets = r.sets.filter(v => typeof v === 'number')
    const epleys = doneSets.map(v => epley(kgNum, v)).filter(Boolean)
    const best1rm = epleys.length ? Math.max(...epleys) : null
    const setsStr = doneSets.length ? doneSets.join(' / ') : '—'
    const boStr = typeof r.bo === 'number' ? ` · bo: ${r.bo}` : ''
    const detail = `${kgRaw} kg · ${setsStr}${boStr}`
    return { name: ex.name, detail, best1rm }
  })
}

function SummaryRows({ rows }) {
  return rows.map((row, i) => (
    <div key={i} className="sum-row">
      <div>
        <div className="sum-liike">{row.name}</div>
        <div className="sum-detail">{row.detail}</div>
      </div>
      <div className="sum-epley">
        {row.best1rm ? `Paras 1RM: ${row.best1rm} kg` : '—'}
      </div>
    </div>
  ))
}

export default function SummaryScreen({ program, workout, bodyweight, onSaved }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [histWeek, setHistWeek] = useState(0)
  const [histDay, setHistDay] = useState(0)

  const hasWorkout = !!workout

  function buildPayload() {
    if (!workout) return null
    const { week, day, results } = workout
    const exercises = program.days[day]
    const tulokset = exercises.map((ex, i) => {
      const r = results[i]
      const numSets = getSetCount(program, week, ex)
      return {
        liike: ex.name,
        set1: typeof r.sets[0] === 'number' ? r.sets[0] : null,
        set2: typeof r.sets[1] === 'number' ? r.sets[1] : null,
        set3: numSets >= 3 ? (typeof r.sets[2] === 'number' ? r.sets[2] : null) : null,
        set4: numSets >= 4 ? (typeof r.sets[3] === 'number' ? r.sets[3] : null) : null,
        bo:   typeof r.bo === 'number' ? r.bo : null,
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
    setSaved(true)
    setSaving(false)
    onSaved?.()
  }

  // Historia-osio
  const histSaved = loadWorkout(histWeek, histDay)
  const histRows = histSaved
    ? buildRows(program, histWeek, histDay, histSaved.results, bodyweight)
    : null

  return (
    <div className="screen">

      {/* ── Meneillään oleva treeni ── */}
      {hasWorkout ? (
        <>
          <div className="screen-title">Päivän yhteenveto</div>
          <div className="screen-sub">
            Päivä {workout.day + 1} · Viikko {workout.week + 1} · RIR {program.weeks[workout.week].rir}
          </div>

          <SummaryRows
            rows={buildRows(program, workout.week, workout.day, workout.results, bodyweight)}
          />

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
        </>
      ) : (
        <>
          <div className="screen-title">Yhteenveto</div>
          <div className="screen-sub">Ei käynnissä olevaa treeniä</div>
        </>
      )}

      {/* ── Historia-selaus ── */}
      <div className="hist-section-title">Selaa aiempia treenejä</div>

      <div className="hist-selector-row">
        <div className="hist-selector-label">Viikko</div>
        <div className="hist-grid">
          {program.weeks.map((w, i) => (
            <button
              key={i}
              className={`hist-btn${histWeek === i ? ' selected' : ''}`}
              onClick={() => setHistWeek(i)}
            >
              V{i + 1}
            </button>
          ))}
        </div>

        <div className="hist-selector-label">Päivä</div>
        <div className="hist-grid">
          {program.days.map((_, di) => (
            <button
              key={di}
              className={`hist-btn${histDay === di ? ' selected' : ''}`}
              onClick={() => setHistDay(di)}
            >
              P{di + 1}
            </button>
          ))}
        </div>
      </div>

      {histRows ? (
        <SummaryRows rows={histRows} />
      ) : (
        <div className="hist-empty">Ei tuloksia tälle päivälle</div>
      )}

    </div>
  )
}
