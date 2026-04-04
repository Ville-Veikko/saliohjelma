import React from 'react'

export default function TimerBar({ timer }) {
  const { remaining, total, running, done, visible, skip, dismiss } = timer
  if (!visible) return null

  const pct = total > 0 ? (remaining / total) * 100 : 0
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const timeStr = done ? 'Lepo ohi!' : `${m}:${String(s).padStart(2, '0')}`

  return (
    <div
      className={`timer-bar${done ? ' done' : ''}`}
      onClick={done ? dismiss : undefined}
    >
      {!done && <div className="timer-fill" style={{ width: `${pct}%` }} />}

      <div className="timer-content">
        {/* Numero on ainoa flex-child → pysyy täsmälleen keskellä */}
        <div className="timer-time">{timeStr}</div>

        {/* Label ja hint absoluuttisesti numeron alapuolella */}
        {!done && <div className="timer-label">LEPO</div>}
        {done && <div className="timer-done-hint">Napauta sulkeaksesi</div>}

        {running && (
          <button className="timer-skip" onClick={e => { e.stopPropagation(); skip() }}>
            Ohita
          </button>
        )}
      </div>
    </div>
  )
}
