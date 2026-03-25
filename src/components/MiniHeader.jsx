import React from 'react'

export default function MiniHeader({ program, weekIndex, dayIndex, onBack }) {
  const week = program.weeks[weekIndex]
  return (
    <div className="mini-header">
      <div>
        <button className="mini-back-btn" onClick={onBack} aria-label="Takaisin aloitusnäkymään">
          ‹ {program.meso}
        </button>
        <div className="mini-title">Viikko {weekIndex + 1} · Päivä {dayIndex + 1}</div>
      </div>
      <div className="mini-rir">RIR {week.rir} · {week.sets}+1 settiä</div>
    </div>
  )
}
