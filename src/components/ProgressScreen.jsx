import React from 'react'
import { epley } from '../utils/epley'

const MAIN_LIFTS = ['Penkki', 'Kyykky', 'Leuat']

/**
 * Rakentaa per-liike historiarivit history.json-datasta.
 * Palauttaa [{ meso, best1rm, bestSet, delta }, ...] järjestyksessä.
 * Leuat: epley-arvo on jo laskettu kehonpaino mukaan (historyData:ssa).
 */
function buildLiftHistory(historyData, liftName) {
  if (!historyData) return []
  const liftKey = liftName.toLowerCase()
  const rows = []
  let prevBest1rm = null

  for (const mesoName of Object.keys(historyData)) {
    const liftData = historyData[mesoName]?.[liftKey]
    if (!liftData?.length) continue

    const best = liftData.reduce((b, e) => e.epley > (b?.epley ?? 0) ? e : b, null)
    if (!best) continue

    const delta = prevBest1rm !== null
      ? Math.round((best.epley - prevBest1rm) * 10) / 10
      : null

    rows.push({
      meso: mesoName,
      best1rm: best.epley,
      bestSet: `${best.kg}×${best.reps}`,
      delta,
    })
    prevBest1rm = best.epley
  }

  return rows
}

function LiftTable({ liftName, history, currentMeso, sheetsEpley, bodyweight }) {
  // Nykyisen meson data Sheetsistä (?action=epley)
  const sheetsLift = sheetsEpley?.data?.epley?.[liftName]
  let currentBest = null
  if (sheetsLift) {
    const isLeuat = liftName === 'Leuat'
    const kgNum = isLeuat ? sheetsLift.bestKg + (bodyweight ?? 0) : sheetsLift.bestKg
    const best1rm = epley(kgNum, sheetsLift.bestReps)
    currentBest = best1rm
      ? { best1rm, bestSet: `${sheetsLift.bestKg}×${sheetsLift.bestReps}` }
      : null
  }

  const prevBest1rm = history.length ? history[history.length - 1].best1rm : null
  const currentRow = {
    meso: currentMeso,
    best1rm: currentBest?.best1rm ?? null,
    bestSet: currentBest
      ? currentBest.bestSet
      : sheetsEpley?.loading ? 'ladataan…' : '—',
    delta: (currentBest && prevBest1rm)
      ? Math.round((currentBest.best1rm - prevBest1rm) * 10) / 10
      : null,
  }

  const allRows = [...history, currentRow]
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

export default function ProgressScreen({ program, bodyweight, sheetsEpley, historyData }) {
  const currentMeso = program.meso.replace('Meso ', 'M').replace(' / ', '/')

  return (
    <div className="screen">
      <div className="screen-title">Voimakehitys</div>
      <div className="screen-sub">Epley 1RM-arviot mesoittain</div>

      {MAIN_LIFTS.map(lift => (
        <React.Fragment key={lift}>
          <div className="section-label">{lift === 'Penkki' ? 'Penkkipunnerrus' : lift}</div>
          <LiftTable
            liftName={lift}
            history={buildLiftHistory(historyData, lift)}
            currentMeso={currentMeso}
            sheetsEpley={sheetsEpley}
            bodyweight={bodyweight}
          />
        </React.Fragment>
      ))}
    </div>
  )
}
