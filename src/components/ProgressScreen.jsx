import React from 'react'
import { epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'

const MAIN_LIFTS = ['Penkki', 'Kyykky', 'Leuat']

/**
 * Laskee nykyisen meson parhaan 1RM-arvion kaikista treenin seteistä.
 * Palauttaa { best1rm, bestSet } tai null jos dataa ei ole.
 */
function calcCurrentMesoBest(program, workout, bodyweight, liftName) {
  if (!workout) return null

  let best1rm = null
  let bestSet = null

  for (let w = 0; w < program.weeks.length; w++) {
    for (let d = 0; d < program.days.length; d++) {
      const saved = workout.week === w && workout.day === d
        ? workout.results
        : null
      if (!saved) continue

      program.days[d].forEach((ex, ei) => {
        if (ex.name !== liftName) return
        const res = saved[ei]
        if (!res) return

        const kgRaw = ex.kg[w]
        const extraKg = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0
        const kgNum = ex.badge === 'leuat' ? extraKg + (bodyweight ?? 0) : extraKg
        if (!kgNum) return

        const numSets = getSetCount(program, w, ex)
        const allReps = [...res.sets.slice(0, numSets)]
        if (ex.boKg !== null && res.bo != null) {
          const boKgNum = ex.boKg === 'bw' ? (bodyweight ?? 0) : parseFloat(ex.boKg) || 0
          const boEp = epley(boKgNum, res.bo)
          if (boEp && (!best1rm || boEp > best1rm)) {
            best1rm = boEp
            bestSet = `${ex.boKg}×${res.bo}`
          }
        }

        allReps.forEach(reps => {
          if (reps == null) return
          const e = epley(kgNum, reps)
          if (e && (!best1rm || e > best1rm)) {
            best1rm = e
            bestSet = `${kgRaw}×${reps}`
          }
        })
      })
    }
  }

  return best1rm ? { best1rm, bestSet } : null
}

function LiftTable({ liftName, program, workout, bodyweight }) {
  const history = program.epleyProgress?.[liftName] ?? []
  const currentMeso = program.meso.replace('Meso ', 'M').replace(' / ', '/')  // "M3/26"
  const currentBest = calcCurrentMesoBest(program, workout, bodyweight, liftName)

  // Rakennetaan rivit: historialliset + nykyinen meso
  const allRows = [
    ...history,
    {
      meso: currentMeso,
      best1rm: currentBest?.best1rm ?? null,
      bestSet: currentBest?.bestSet ?? 'ei dataa',
      delta: (() => {
        if (!currentBest || !history.length) return null
        const prev = history[history.length - 1]?.best1rm
        if (!prev) return null
        return Math.round((currentBest.best1rm - prev) * 10) / 10
      })(),
    },
  ]

  // Korkein 1RM koko historiassa (korostus)
  const maxEver = Math.max(...allRows.map(r => r.best1rm ?? 0))

  return (
    <div className="ep-table">
      <div className="ep-hdr">
        <span>Meso</span>
        <span>1RM arvio</span>
        <span>Paras setti</span>
        <span>+/−</span>
      </div>
      {allRows.map((row, i) => {
        const isBest = row.best1rm && row.best1rm === maxEver
        const deltaEl = row.delta == null
          ? <span className="ep-dim">—</span>
          : row.delta > 0
            ? <span className="ep-up">+{row.delta}</span>
            : <span className="ep-down">{row.delta}</span>

        return (
          <div key={i} className={`ep-row${isBest ? ' ep-best-row' : ''}`}>
            <span className="ep-meso">{row.meso}</span>
            <span className={isBest ? 'ep-best' : row.best1rm ? '' : 'ep-dim'}>
              {row.best1rm ? `${row.best1rm} kg` : '—'}
            </span>
            <span className={isBest ? 'ep-best' : 'ep-dim'}>{row.bestSet}</span>
            {deltaEl}
          </div>
        )
      })}
    </div>
  )
}

export default function ProgressScreen({ program, workout, bodyweight }) {
  return (
    <div className="screen">
      <div className="screen-title">Voimakehitys</div>
      <div className="screen-sub">Epley 1RM-arviot mesoittain</div>

      {MAIN_LIFTS.map(lift => (
        <React.Fragment key={lift}>
          <div className="section-label">{lift === 'Penkki' ? 'Penkkipunnerrus' : lift}</div>
          <LiftTable
            liftName={lift}
            program={program}
            workout={workout}
            bodyweight={bodyweight}
          />
        </React.Fragment>
      ))}
    </div>
  )
}
