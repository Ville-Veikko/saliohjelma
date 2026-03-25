import React from 'react'
import { getDayProgress } from '../utils/storage'

function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' })
    + ' ' + d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}

export default function StartScreen({ program, selectedWeek, selectedDay, setSelectedWeek, setSelectedDay, savedInfo, onStart }) {
  const ready = selectedWeek >= 0 && selectedDay >= 0

  // Lasketaan päivien valmius kertaalleen renderöinnin yhteydessä
  // isDayDone[weekIdx][dayIdx] = true jos >50 % seteistä tehty
  const isDayDone = program.weeks.map((_, wi) =>
    program.days.map((_, di) => getDayProgress(wi, di) > 0.5)
  )
  const isWeekDone = program.weeks.map((_, wi) =>
    program.days.every((_, di) => isDayDone[wi][di])
  )

  // Jos tallennettu data on sama kuin valittu viikko/päivä, tarjotaan resumea
  const showResume =
    savedInfo &&
    savedInfo.week === selectedWeek &&
    savedInfo.day === selectedDay

  return (
    <div className="start-screen">
      <div className="start-title">Saliohjelma</div>
      <div className="start-sub">{program.meso} · Valitse viikko ja päivä</div>

      {/* Resume-banneri — näkyy jos on tallennettu treeni ja molemmat on valittu */}
      {showResume && (
        <div className="resume-banner">
          <div className="resume-text">
            <strong>Keskeneräinen treeni</strong>
            Tallennettu {formatTimestamp(savedInfo.timestamp)}
          </div>
          <button className="resume-btn" onClick={() => onStart(selectedWeek, selectedDay)}>
            Jatka →
          </button>
        </div>
      )}

      <div className="start-section">Viikko</div>
      <div className="start-grid">
        {program.weeks.map((w, i) => (
          <div
            key={i}
            className={`start-btn${selectedWeek === i ? ' selected' : ''}${isWeekDone[i] ? ' done' : ''}`}
            onClick={() => setSelectedWeek(i)}
          >
            <div className="start-btn-main">
              {isWeekDone[i] && <span className="done-check">✓ </span>}
              Viikko {i + 1}
            </div>
            <div className="start-btn-sub">RIR {w.rir} · {w.sets}+1</div>
          </div>
        ))}
      </div>

      <div className="start-section">Päivä</div>
      <div className="start-grid">
        {program.days.map((day, di) => {
          const done = selectedWeek >= 0 && isDayDone[selectedWeek][di]
          return (
            <div
              key={di}
              className={`start-btn${selectedDay === di ? ' selected' : ''}${done ? ' done' : ''}`}
              onClick={() => setSelectedDay(di)}
            >
              <div className="start-btn-main">
                {done && <span className="done-check">✓ </span>}
                Päivä {di + 1}
              </div>
              <div className="start-btn-sub">{day.length} liikettä</div>
            </div>
          )
        })}
      </div>

      <button
        className={`start-go${ready ? ' ready' : ''}`}
        onClick={() => ready && onStart(selectedWeek, selectedDay)}
      >
        Aloita treeni →
      </button>
    </div>
  )
}
