import React, { useState, useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js'
import { epley } from '../utils/epley'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const MAIN_LIFTS = ['Penkki', 'Kyykky', 'Leuat']

const LINE_COLOR = '#a855f7'
const LINE_COLOR_DIM = '#7c3aed44'

/** Gaussinen kernel-tasoitus: symmetrinen painotettu keskiarvo, ei EMA-viive */
function gaussianSmooth(points, sigma) {
  const n = points.length
  const result = new Array(n).fill(null)
  const valid = []
  for (let i = 0; i < n; i++) if (points[i] != null) valid.push({ v: points[i], i })
  if (!valid.length) return result
  for (let i = 0; i < n; i++) {
    let wSum = 0, wTotal = 0
    for (const { v, i: j } of valid) {
      const w = Math.exp(-((i - j) ** 2) / (2 * sigma * sigma))
      wSum += v * w
      wTotal += w
    }
    if (wTotal > 1e-6) result[i] = Math.round(wSum / wTotal * 10) / 10
  }
  return result
}

const MESO_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#38bdf8',
  '#a78bfa', '#4ade80', '#fb923c', '#e879f9', '#2dd4bf',
  '#facc15', '#f472b6', '#818cf8', '#a855f7',
]

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
  const bw = bodyweight ?? 84
  const labels = [], points = [], extras = [], mesoIndices = []
  let mesoIdx = 0

  for (const [mesoName, mesoData] of Object.entries(workoutHistory)) {
    if (!mesoData) { mesoIdx++; continue }
    const liftData = mesoData[liftKey]
    const weekCount = mesoData.viikot

    for (let wi = 0; wi < weekCount; wi++) {
      const weekKey = `V${wi + 1}`
      labels.push(wi === 0 ? mesoName : '')
      mesoIndices.push(mesoIdx)

      if (!liftData) { points.push(null); extras.push(null); continue }
      const weekData = liftData[weekKey]
      if (!weekData) { points.push(null); extras.push(null); continue }
      const raskasKg = weekData.raskas_kg
      if (raskasKg == null) { points.push(null); extras.push(null); continue }

      const kgNum = isLeuat ? raskasKg + bw : raskasKg
      let bestEpley = null, bestReps = null

      for (const dayData of Object.values(weekData.paivat ?? {})) {
        if (!dayData) continue
        for (const reps of (dayData.raskas ?? [])) {
          if (typeof reps === 'number') {
            const e = epley(kgNum, reps)
            if (e && (!bestEpley || e > bestEpley)) { bestEpley = e; bestReps = reps }
          }
        }
      }
      points.push(bestEpley)
      extras.push(bestEpley ? { kg: kgNum, reps: bestReps, extraKg: isLeuat ? raskasKg : null } : null)
    }
    mesoIdx++
  }

  // Leikkaa tyhjä alku (esim. leuat M3/24–M6/25)
  const firstIdx = points.findIndex(p => p != null)
  if (firstIdx > 0) {
    labels.splice(0, firstIdx)
    points.splice(0, firstIdx)
    extras.splice(0, firstIdx)
    mesoIndices.splice(0, firstIdx)
  }

  // Lisää M3/26 sheetsEpley:stä (triimin jälkeen)
  const sl = sheetsEpley?.data?.epley?.[liftName]
  if (sl) {
    const kgNum = isLeuat ? sl.bestKg + bw : sl.bestKg
    const e = epley(kgNum, sl.bestReps) ?? null
    labels.push('M3/26')
    points.push(e)
    extras.push(e ? { kg: kgNum, reps: sl.bestReps, extraKg: isLeuat ? sl.bestKg : null } : null)
    mesoIndices.push(13)
  }

  const ema = gaussianSmooth(points, 8)

  return { labels, points, extras, ema, mesoIndices }
}

function EpleyChart({ liftName, workoutHistory, sheetsEpley, bodyweight }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !workoutHistory) return

    const { labels, points, extras, ema, mesoIndices } = buildChartData(workoutHistory, liftName, sheetsEpley, bodyweight)

    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: liftName,
            data: points,
            showLine: false,
            pointRadius: points.map(p => p != null ? 3 : 0),
            pointHoverRadius: 6,
            pointBackgroundColor: points.map((p, i) =>
              p != null ? MESO_COLORS[mesoIndices[i] % MESO_COLORS.length] : 'transparent'
            ),
            spanGaps: false,
            fill: false,
          },
          {
            label: 'EMA',
            data: ema,
            borderColor: LINE_COLOR,
            backgroundColor: LINE_COLOR_DIM,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex === 0,
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

  if (!workoutHistory) {
    return <div className="ep-chart-wrap ep-loading">Ladataan…</div>
  }

  return (
    <div className="ep-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  )
}

const FI_MONTHS = ['tammikuu','helmikuu','maaliskuu','huhtikuu','toukokuu','kesäkuu',
  'heinäkuu','elokuu','syyskuu','lokakuu','marraskuu','joulukuu']

const YEAR_COLORS = { '2024': '#1d9e75', '2025': '#3266ad', '2026': '#d4537e' }

function BodyChart({ data, field, label, unit }) {
  const canvasRef = useRef(null)

  const years = (data ?? []).map(d => String(d.pvm).split('-')[0])
  const uniqueYears = [...new Set(years.filter(Boolean))]

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return

    const labels = data.map(d => d.pvm)
    const points = data.map(d => d[field] ?? null)

    const ema = gaussianSmooth(points, 5)

    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data: points,
            showLine: false,
            pointRadius: points.map(p => p != null ? 3 : 0),
            pointHoverRadius: 6,
            pointBackgroundColor: points.map((p, i) =>
              p != null ? (YEAR_COLORS[years[i]] ?? LINE_COLOR) : 'transparent'
            ),
            spanGaps: false,
            fill: false,
          },
          {
            label: 'EMA',
            data: ema,
            borderColor: LINE_COLOR,
            backgroundColor: LINE_COLOR_DIM,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex === 0,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${unit}`,
              title: (items) => {
                const pvm = labels[items[0]?.dataIndex ?? 0]
                if (!pvm) return ''
                const parts = pvm.split('-')
                return `${FI_MONTHS[parseInt(parts[1], 10) - 1]} ${parts[0]}`
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#aaa',
              font: { size: 9 },
              maxRotation: 0,
              autoSkip: false,
              callback: (_, index) => {
                if (index === 0 || years[index] !== years[index - 1]) return years[index]
                return ''
              },
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
  }, [data, field, label, unit])

  if (!data) return <div className="ep-chart-wrap ep-keho-chart ep-loading">Ladataan…</div>
  if (!data.length) return <div className="ep-chart-wrap ep-keho-chart ep-loading">Ei dataa</div>
  return (
    <>
      <div className="ep-chart-wrap ep-keho-chart"><canvas ref={canvasRef} /></div>
      <div className="ep-year-legend">
        {uniqueYears.map(y => (
          <span key={y} className="ep-year-badge" style={{ background: YEAR_COLORS[y] ?? LINE_COLOR }}>{y}</span>
        ))}
      </div>
    </>
  )
}

export default function ProgressScreen({ program, bodyweight, sheetsEpley, sheetsKeho, historyData, workoutHistory }) {
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
        <button
          className={`ep-tab${tab === 'keho' ? ' active' : ''}`}
          onClick={() => setTab('keho')}
        >
          Keho
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

      {tab === 'keho' && (
        sheetsKeho?.loading ? (
          <div className="hist-empty">Ladataan kehon dataa…</div>
        ) : sheetsKeho?.error ? (
          <div className="hist-empty">Datan lataus epäonnistui</div>
        ) : (
          <>
            {[
              { field: 'paino', label: 'Paino', unit: 'kg' },
              { field: 'rasva', label: 'Rasvaprosentti', unit: '%' },
              { field: 'lihas', label: 'Lihasmassa', unit: 'kg' },
            ].map(({ field, label, unit }) => (
              <React.Fragment key={field}>
                <div className="section-label">{label} ({unit})</div>
                <BodyChart
                  data={sheetsKeho?.data?.data ?? []}
                  field={field}
                  label={label}
                  unit={unit}
                />
              </React.Fragment>
            ))}
          </>
        )
      )}
    </div>
  )
}
