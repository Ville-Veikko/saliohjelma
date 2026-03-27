import React from 'react'

const CIRC = 2 * Math.PI * 17  // r=17 → ~106.8

export default function TimerBar({ timer }) {
  const { remaining, total, running, done, visible, skip, dismiss } = timer

  if (!visible) return null

  const pct = remaining / total
  const offset = ((1 - pct) * CIRC).toFixed(1)

  let ringColor = '#a855f7'
  if (remaining <= 10) ringColor = '#f87171'
  else if (remaining <= 30) ringColor = '#fbbf24'

  const m = Math.floor(remaining / 60)
  const s = remaining % 60

  return (
    <div
      className={`timer-bar${done ? ' done' : ''}`}
      onClick={done ? dismiss : undefined}
    >
      <div className="timer-ring-wrap">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle className="timer-bg" cx="20" cy="20" r="17" />
          <circle
            className="timer-fg"
            cx="20" cy="20" r="17"
            strokeDasharray={CIRC.toFixed(1)}
            strokeDashoffset={done ? '0' : offset}
            stroke={done ? '#4ade80' : ringColor}
          />
        </svg>
        <div className="timer-num">
          {done ? '✓' : `${m}:${String(s).padStart(2, '0')}`}
        </div>
      </div>

      <div className="timer-info">
        <div className={`timer-text${done ? ' done-text' : ''}`}>
          {done ? 'Lepo ohi — seuraava setti!' : 'Lepo käynnissä'}
        </div>
        <div className={`timer-subtext${done ? ' done-sub' : ''}`}>
          {done ? 'Napauta sulkeaksesi' : `${remaining}s jäljellä`}
        </div>
      </div>

      {running && (
        <button className="timer-skip" onClick={e => { e.stopPropagation(); skip() }}>
          Ohita
        </button>
      )}
    </div>
  )
}
