import React, { useState, useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'
import { epley } from '../utils/epley'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const MAIN_LIFTS = ['Penkki', 'Kyykky', 'Leuat']

const MESO_COLORS = {
  'M4/24': '#505050',
  'M5/24': '#6a6a6a',
  'M6/24': '#898989',
  'M1/25': '#1a3566',
  'M2/25': '#1e4480',
  'M3/25': '#205998',
  'M4/25': '#2570b8',
  'M5/25': '#3388d4',
  'M6/25': '#52a0ea',
  'M7/25': '#7bbcf6',
  'M1/26': '#7c3aed',
  'M2/26': '#9333ea',
  'M3/26': '#a855f7',
}

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

function EpleyChart({ liftName, historyData, sheetsEpley, bodyweight }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !historyData) return

    const liftKey = liftName.toLowerCase()
    const datasets = []

    // Laske viikkojen maksimimäärä tässä liikkeessä
    let maxWeeks = 0
    for (const mesoData of Object.values(historyData)) {
      const ld = mesoData[liftKey]
      if (ld) maxWeeks = Math.max(maxWeeks, ld.length)
    }
    // M3/26 on yksi piste, ei tarvita ylimääräistä paikkaa
    maxWeeks = Math.max(maxWeeks, 1)

    // Historialliset mesot
    for (const [mesoName, mesoData] of Object.entries(historyData)) {
      const liftData = mesoData[liftKey]
      if (!liftData?.length) continue

      const color = MESO_COLORS[mesoName] ?? '#888'
      // Täytä null-arvoilla jos viikkoja vähemmän kuin max
      const dataPoints = Array(maxWeeks).fill(null)
      liftData.forEach((entry, i) => {
        dataPoints[i] = entry.epley
      })

      datasets.push({
        label: mesoName,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: false,
      })
    }

    // M3/26 Sheetsistä (yksi piste)
    const sheetsLift = sheetsEpley?.data?.epley?.[liftName]
    if (sheetsLift) {
      const isLeuat = liftName === 'Leuat'
      const kgNum = isLeuat ? sheetsLift.bestKg + (bodyweight ?? 0) : sheetsLift.bestKg
      const best1rm = epley(kgNum, sheetsLift.bestReps)
      if (best1rm) {
        const dataPoints = Array(maxWeeks).fill(null)
        dataPoints[0] = best1rm
        datasets.push({
          label: 'M3/26',
          data: dataPoints,
          borderColor: MESO_COLORS['M3/26'],
          backgroundColor: MESO_COLORS['M3/26'],
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.3,
          spanGaps: false,
        })
      }
    }

    const labels = Array.from({ length: maxWeeks }, (_, i) => `V${i + 1}`)

    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#aaa',
              font: { size: 10 },
              boxWidth: 14,
              padding: 6,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} kg`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#aaa', font: { size: 11 } },
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
  }, [liftName, historyData, sheetsEpley, bodyweight])

  return (
    <div className="ep-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function ProgressScreen({ program, bodyweight, sheetsEpley, historyData }) {
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
            historyData={historyData}
            sheetsEpley={sheetsEpley}
            bodyweight={bodyweight}
          />
        </>
      )}
    </div>
  )
}
