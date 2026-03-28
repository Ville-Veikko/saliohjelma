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

function EpleyChart({ liftName, historyData, sheetsEpley, bodyweight }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !historyData) return

    const liftKey = liftName.toLowerCase()

    // Rakennetaan x-akseli: kaikki historyData-mesot + M3/26
    const mesoLabels = [...Object.keys(historyData), 'M3/26']

    // Yksi arvo per meso: paras epley siitä mesosta
    const extraData = [] // { kg, reps } tooltip-näyttöä varten
    const dataPoints = mesoLabels.map(mesoName => {
      if (mesoName === 'M3/26') {
        const sl = sheetsEpley?.data?.epley?.[liftName]
        if (!sl) { extraData.push(null); return null }
        const kgNum = liftName === 'Leuat' ? sl.bestKg + (bodyweight ?? 0) : sl.bestKg
        const e = epley(kgNum, sl.bestReps) ?? null
        extraData.push(e ? { kg: kgNum, reps: sl.bestReps } : null)
        return e
      }
      const liftData = historyData[mesoName]?.[liftKey]
      if (!liftData?.length) { extraData.push(null); return null }
      const best = liftData.reduce((b, e) => e.epley > (b?.epley ?? 0) ? e : b, null)
      if (!best) { extraData.push(null); return null }
      const displayKg = liftName === 'Leuat' ? best.kg + (bodyweight ?? 0) : best.kg
      extraData.push({ kg: displayKg, reps: best.reps })
      return best.epley
    })

    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: mesoLabels,
        datasets: [{
          label: liftName,
          data: dataPoints,
          borderColor: LINE_COLOR,
          backgroundColor: LINE_COLOR_DIM,
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: mesoLabels.map((m, i) =>
            dataPoints[i] != null ? LINE_COLOR : 'transparent'
          ),
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
                const extra = extraData[ctx.dataIndex]
                if (extra) return `${ctx.parsed.y} kg — ${extra.kg} kg × ${extra.reps}`
                return `${ctx.parsed.y} kg`
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#aaa', font: { size: 10 }, maxRotation: 45 },
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
