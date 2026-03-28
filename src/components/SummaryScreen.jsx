import React, { useState } from 'react'
import { epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'

// kg-label joka huomioi leuat-lisäpainon + kehonpaino
function kgDisplay(kgRaw, isLeuat, bodyweight) {
  if (isLeuat) {
    const bw = bodyweight ? String(bodyweight) : 'bw'
    return `${kgRaw} + ${bw}`
  }
  return String(kgRaw)
}

// back-off kg -label
function boKgDisplay(boKgRaw) {
  if (boKgRaw == null) return null
  if (boKgRaw === 'bw') return 'bw'
  return `${boKgRaw} kg`
}

// Rakentaa rivit aktiivisesta treenistä (localStorage-results-rakenne)
function buildRowsFromWorkout(program, week, day, results, bodyweight) {
  const exercises = program.days[day]
  return exercises.map((ex, i) => {
    const r = results[i]
    if (!r) return { name: ex.name, detail: '—', best1rm: null }
    const kgRaw = ex.kg[week]
    const isLeuat = ex.badge === 'leuat'
    const kgNum = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0
    const epleyKg = isLeuat ? kgNum + (bodyweight ?? 0) : kgNum
    const doneSets = r.sets.filter(v => typeof v === 'number')
    const epleys = doneSets.map(v => epley(epleyKg, v)).filter(Boolean)
    const best1rm = epleys.length ? Math.max(...epleys) : null
    const setsStr = doneSets.length ? doneSets.join(' / ') : '—'
    const boLabel = boKgDisplay(ex.boKg)
    const boStr = typeof r.bo === 'number'
      ? boLabel ? ` · bo ${boLabel}: ${r.bo}` : ` · bo: ${r.bo}`
      : ''
    return { name: ex.name, detail: `${kgDisplay(kgRaw, isLeuat, bodyweight)} kg · ${setsStr}${boStr}`, best1rm }
  })
}

// Rakentaa rivit Sheets-historiasta ({ liike, set1, set2, set3, set4, bo })
function buildRowsFromSheets(program, tulokset, viikko, paiva, bodyweight) {
  const week = viikko - 1
  const dayNum = parseInt(String(paiva).replace('Day ', ''), 10) - 1
  const exercises = program.days[dayNum] || []
  return tulokset.map(t => {
    const ex = exercises.find(e => e.name === t.liike)
    const kgRaw = ex ? ex.kg[week] : null
    const isLeuat = ex?.badge === 'leuat'
    const kgNum = !kgRaw ? 0 : kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0
    const epleyKg = isLeuat ? kgNum + (bodyweight ?? 0) : kgNum
    const doneSets = [t.set1, t.set2, t.set3, t.set4].filter(v => typeof v === 'number')
    const epleys = epleyKg ? doneSets.map(v => epley(epleyKg, v)).filter(Boolean) : []
    const best1rm = epleys.length ? Math.max(...epleys) : null
    const setsStr = doneSets.length ? doneSets.join(' / ') : '—'
    const boLabel = ex ? boKgDisplay(ex.boKg) : null
    const boStr = typeof t.bo === 'number'
      ? boLabel ? ` · bo ${boLabel}: ${t.bo}` : ` · bo: ${t.bo}`
      : ''
    const kgLabel = kgRaw ?? '?'
    return { name: t.liike, detail: `${kgDisplay(kgLabel, isLeuat, bodyweight)} kg · ${setsStr}${boStr}`, best1rm }
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

export default function SummaryScreen({ program, workout, bodyweight, sheetsHistory, initialHistWeek, initialHistDay, onSaved }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [histWeek, setHistWeek] = useState(initialHistWeek ?? 0)
  const [histDay, setHistDay] = useState(initialHistDay ?? 0)

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

  // Historia-osio: hae valitun viikon/päivän data Sheets-historiasta
  const histKey = `v${histWeek + 1}_Day${histDay + 1}`
  const histEntry = sheetsHistory?.data?.[histKey]
  const histRows = histEntry
    ? buildRowsFromSheets(program, histEntry.tulokset, histEntry.viikko, histEntry.paiva, bodyweight)
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
            rows={buildRowsFromWorkout(program, workout.week, workout.day, workout.results, bodyweight)}
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
          {program.weeks.map((_, i) => (
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

      {sheetsHistory?.loading ? (
        <div className="hist-empty">Ladataan historiaa...</div>
      ) : sheetsHistory?.error ? (
        <div className="hist-empty">Historian lataus epäonnistui</div>
      ) : histRows ? (
        <SummaryRows rows={histRows} />
      ) : (
        <div className="hist-empty">Ei tuloksia tälle päivälle</div>
      )}

    </div>
  )
}
