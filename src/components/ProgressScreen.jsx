import React, { useState, useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js'
import { epley } from '../utils/epley'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const MAIN_LIFTS = ['Penkki', 'Kyykky', 'Leuat']

const LINE_COLOR = '#a855f7'
const LINE_COLOR_DIM = '#7c3aed44'

/**
 * Rakentaa per-liike historiarivit history.json-datasta.
 * Palauttaa [{ meso, best1rm, bestSet, delta }, ...] järjestyksessä.
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

function buildChartData(workoutHistory, liftName, sheetsEpley, bodyweight) {
  const liftKey = liftName.toLowerCase()
  const isLeuat = liftName === 'Leuat'
  const labels = []
  const points = []
  const extras = []

  for (const [mesoName, mesoData] of Object.entries(workoutHistory)) {
    const liftData = mesoData[liftKey]
    const weekCount = mesoData.viikot

    for (let wi = 0; wi < weekCount; wi++) {
      const weekKey = `V${wi + 1}`
      labels.push(wi === 0 ? mesoName : '')

      if (!liftData) {
        points.push(null)
        extras.push(null)
        continue
      }

      const weekData = liftData[weekKey]
      if (!weekData) {
        points.push(null)
        extras.push(null)
        continue
      }

      const raskasKg = weekData.raskas_kg
      const kgNum = isLeuat ? raskasKg + (bodyweight ?? 0) : raskasKg

      let bestEpley = null
      let bestReps = null

      for (const dayData of Object.values(weekData.paivat)) {
        for (const reps of (dayData.raskas ?? [])) {
          if (typeof reps === 'number') {
            const e = epley(kgNum, reps)
            if (e && (!bestEpley || e > bestEpley)) {
              bestEpley = e
              bestReps = reps
            }
          }
        }
      }

      points.push(bestEpley)
      extras.push(bestEpley ? { kg: kgNum, reps: bestReps, extraKg: isLeuat ? raskasKg : null } : null)
    }
  }

  // Lisää M3/26 sheetsEpley:stä
  const sl = sheetsEpley?.data?.epley?.[liftName]
  if (sl) {
    const kgNum = isLeuat ? sl.bestKg + (bodyweight ?? 0) : sl.bestKg
    const e = epley(kgNum, sl.bestReps) ?? null
    labels.push('M3/26')
    points.push(e)
    extras.push(e ? { kg: kgNum, reps: sl.bestReps, extraKg: isLeuat ? sl.bestKg : null } : null)
  }

  return { labels, points, extras }
}

function EpleyChart({ liftName, workoutHistory, sheetsEpley, bodyweight }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !workoutHistory) return

    const { labels, points, extras } = buildChartData(workoutHistory, liftName, sheetsEpley, bodyweight)

    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: liftName,
          data: points,
          borderColor: LINE_COLOR,
          backgroundColor: LINE_COLOR_DIM,
          borderWidth: 2,
          pointRadius: points.map(p => p != null ? 4 : 0),
          pointHoverRadius: 6,
          pointBackgroundColor: points.map(p => p != null ? LINE_COLOR : 'transparent'),
          tension: 0.3,
          spanGaps: false,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.parsed.y == null) return ''
                const extra = extras[ctx.dataIndex]
                if (extra) {
                  const kgStr = extra.extraKg != null
                    ? (extra.extraKg > 0 ? `bw + ${extra.extraKg} kg` : 'bw')
                    : `${extra.kg} kg`
                  return `${ctx.parsed.y} kg — ${kgStr} × ${extra.reps}`
                }
                return `${ctx.parsed.y} kg`
              },
              title: (items) => {
                // Näytä tooltip-otsikossa viikkonumero jos label on tyhjä
                const idx = items[0]?.dataIndex ?? 0
                // Löydä edellinen ei-tyhjä label (meso nimi) ja viikkonumero
                let mesoName = ''
                let weekNum = 1
                for (let i = idx; i >= 0; i--) {
                  if (labels[i]) { mesoName = labels[i]; weekNum = idx - i + 1; break }
                }
                return `${mesoName} V${weekNum}`
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#aaa',
              font: { size: 9 },
              maxRotation: 45,
              autoSkip: false,
              callback: (_, index) => labels[index],
            },
            grid: { color: '#2a2a2a' },
            border: { color: '#333' },
          },
          y: {
            ticks: { color: '#aaa', font: { size: 11 } },
            grid: { color: '#2a2a2a' },
            border: { color: '#333' },
          },
        },
      },
    })

    return () => chart.destroy()
  }, [liftName, workoutHistory, sheetsEpley, bodyweight])

  return (
    <div className="ep-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function ProgressScreen({ program, bodyweight, sheetsEpley, historyData, workoutHistory }) {
  const [tab, setTab] = useState('taulukko')
  const [selectedLift, setSelectedLift] = useState('Penkki')
  const currentMeso = program.meso.replace('Meso ', 'M').replace(' / ', '/')

  return (
    <div className="screen">
      <div className="screen-title">Voimakehitys</div>

      <div className="ep-tabs">
        <button
          className={`ep-tab${tab === 'taulukko' ? ' active' : ''}`}
          onClick={() => setTab('taulukko')}
        >
          Taulukko
        </button>
        <button
          className={`ep-tab${tab === 'graafi' ? ' active' : ''}`}
          onClick={() => setTab('graafi')}
        >
          Graafi
        </button>
      </div>

      {tab === 'taulukko' && MAIN_LIFTS.map(lift => (
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

      {tab === 'graafi' && (
        <>
          <div className="ep-lift-btns">
            {MAIN_LIFTS.map(lift => (
              <button
                key={lift}
                className={`ep-lift-btn${selectedLift === lift ? ' active' : ''}`}
                onClick={() => setSelectedLift(lift)}
              >
                {lift === 'Penkki' ? 'Penkki' : lift}
              </button>
            ))}
          </div>
          <EpleyChart
            liftName={selectedLift}
            workoutHistory={workoutHistory}
            sheetsEpley={sheetsEpley}
            bodyweight={bodyweight}
          />
        </>
      )}
    </div>
  )
}
