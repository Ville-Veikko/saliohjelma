import React, { useState } from 'react'
import { epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'

// ── Apufunktiot nykyiselle treenille ──────────────────────────────────────

function kgDisplay(kgRaw, isLeuat, bodyweight) {
  if (isLeuat) {
    const bw = bodyweight ? String(bodyweight) : 'bw'
    return `${kgRaw} + ${bw}`
  }
  return String(kgRaw)
}

function boKgDisplay(boKgRaw) {
  if (boKgRaw == null) return null
  if (boKgRaw === 'bw') return 'bw'
  return `${boKgRaw} kg`
}

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

// ── Historia-kortit ───────────────────────────────────────────────────────

/** Hakee tulokset-rivin Sheetsistä: { set1..4, bo } tai null */
function getTulokset(sheetsData, week, day, exerciseName) {
  const entry = sheetsData?.[`v${week + 1}_Day${day + 1}`]
  return entry?.tulokset?.find(t => t.liike === exerciseName) ?? null
}

/** Muotoilee setit yhden päivän datasta: "4/4/3" tai "—" */
function fmtSets(t, numSets) {
  if (!t) return '—'
  const vals = [t.set1, t.set2, t.set3, t.set4].slice(0, numSets)
  if (vals.every(v => v == null)) return '—'
  return vals.map(v => (typeof v === 'number' ? v : '?')).join('/')
}

/** Pääliikekortit: Penkki / Kyykky / Leuat — kaikki päivät valitulta viikolta */
function MainLiftCard({ liftName, program, histWeek, sheetsData }) {
  const ex = program.days[0].find(e => e.name === liftName)
  if (!ex) return null
  const numSets = program.weeks[histWeek].sets
  const mainKg = ex.kg[histWeek]
  const boKg = ex.boKg

  const dayCount = program.days.length
  const setsByDay = program.days.map((_, di) => {
    const t = getTulokset(sheetsData, histWeek, di, liftName)
    return fmtSets(t, numSets)
  })
  const boByDay = program.days.map((_, di) => {
    const t = getTulokset(sheetsData, histWeek, di, liftName)
    if (!t || typeof t.bo !== 'number') return '—'
    return String(t.bo)
  })

  return (
    <div className="hist-card">
      <div className="hist-card-title">{liftName}</div>
      <div className="hist-lift-grid" style={{ gridTemplateColumns: `68px repeat(${dayCount}, 1fr)` }}>
        <span />
        {program.days.map((_, di) => (
          <span key={di} className="hist-col-hdr">P{di + 1}</span>
        ))}
        <span className="hist-lift-kg">{mainKg} kg</span>
        {setsByDay.map((s, di) => (
          <span key={di} className="hist-lift-sets">{s}</span>
        ))}
        {boKg != null && <>
          <span className="hist-lift-kg hist-bo-kg">{boKg === 'bw' ? 'bw' : `${boKg} kg`}</span>
          {boByDay.map((b, di) => (
            <span key={di} className="hist-lift-sets hist-bo-sets">{b}</span>
          ))}
        </>}
      </div>
    </div>
  )
}

/** Olkapää-kortti: yksi rivi per päivä, hartialiike voi olla eri per päivä */
function ShoulderCard({ program, histWeek, sheetsData }) {
  const numSets = program.weeks[histWeek].sets
  const rows = program.days.map((day, di) => {
    const ex = day[3] // hartialiike on aina indeksi 3
    if (!ex) return null
    const kgRaw = ex.kg[histWeek]
    const kgLabel = kgRaw === 'bw' ? 'bw' : `${kgRaw} kg`
    const t = getTulokset(sheetsData, histWeek, di, ex.name)
    const sets = fmtSets(t, numSets)
    return { label: `P${di + 1}`, name: ex.name, kgLabel, sets }
  }).filter(Boolean)

  return (
    <div className="hist-card">
      <div className="hist-card-title">Olkapäät</div>
      {rows.map((row, i) => (
        <div key={i} className="hist-aux-row">
          <span className="hist-aux-label">{row.label}</span>
          <span className="hist-aux-name">{row.name}</span>
          <span className="hist-aux-detail">{row.kgLabel} · {row.sets}</span>
        </div>
      ))}
    </div>
  )
}

/** Erilliset kortit: Crunch/Ojentajat/Hauiskäännöt — kaikki viikot yhdellä päivällä */
function AuxCard({ program, day, sheetsData }) {
  const ex = program.days[day]?.[4]
  if (!ex) return null

  const rows = program.weeks.map((w, wi) => {
    const numSets = w.sets
    const kgRaw = ex.kg[wi]
    const kgLabel = kgRaw === 'bw' ? 'bw' : `${kgRaw} kg`
    const t = getTulokset(sheetsData, wi, day, ex.name)
    const sets = fmtSets(t, numSets)
    const hasData = t != null
    return { label: `V${wi + 1}`, kgLabel, sets, hasData }
  })

  return (
    <div className="hist-card">
      <div className="hist-card-title">{ex.name}</div>
      {rows.map((row, i) => (
        <div key={i} className="hist-aux-row">
          <span className="hist-aux-label">{row.label}</span>
          {row.hasData
            ? <span className="hist-aux-detail">{row.kgLabel} · {row.sets}</span>
            : <span className="hist-aux-empty">—</span>
          }
        </div>
      ))}
    </div>
  )
}

// ── Pääkomponentti ────────────────────────────────────────────────────────

export default function SummaryScreen({ program, workout, bodyweight, sheetsHistory, initialHistWeek, initialHistDay, onSaved }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [histWeek, setHistWeek] = useState(initialHistWeek ?? 0)

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

  const sheetsData = sheetsHistory?.data ?? null

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

      {sheetsHistory?.loading ? (
        <div className="hist-empty">Ladataan historiaa...</div>
      ) : sheetsHistory?.error ? (
        <div className="hist-empty">Historian lataus epäonnistui</div>
      ) : (
        <>
          {/* Viikkosuodatin */}
          <div className="hist-selector-row">
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
          </div>

          {/* Pääliikekortit */}
          {['Penkki', 'Kyykky', 'Leuat'].map(lift => (
            <MainLiftCard
              key={lift}
              liftName={lift}
              program={program}
              histWeek={histWeek}
              sheetsData={sheetsData}
            />
          ))}

          {/* Olkapää-kortti */}
          <ShoulderCard
            program={program}
            histWeek={histWeek}
            sheetsData={sheetsData}
          />

          {/* Erilliset kortit per päivä */}
          {program.days.map((_, di) => (
            <AuxCard
              key={di}
              program={program}
              day={di}
              sheetsData={sheetsData}
            />
          ))}
        </>
      )}

    </div>
  )
}
