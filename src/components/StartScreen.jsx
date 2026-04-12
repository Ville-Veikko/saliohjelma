import React from 'react'

function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'numeric' })
    + ' ' + d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}

export default function StartScreen({
  program,
  selectedWeek, selectedDay,
  setSelectedWeek, setSelectedDay,
  savedInfo, sheetsHistory,
  onStart, onStartFresh, onViewResults,
}) {
  const ready = selectedWeek >= 0 && selectedDay >= 0
  const histData = sheetsHistory?.data

  // Sheets-pohjainen valmius — tarkistetaan että päivällä on oikeita tuloksia
  function isDayInSheets(wi, di) {
    const entry = histData?.[`v${wi + 1}_Day${di + 1}`]
    if (!entry?.tulokset) return false
    return entry.tulokset.some(t => t.set1 != null)
  }
  function isWeekInSheets(wi) {
    return program.days.every((_, di) => isDayInSheets(wi, di))
  }

  // Valittu päivä Sheetsissa
  const selectedInSheets = ready && isDayInSheets(selectedWeek, selectedDay)

  // Jatka-banneri: localStorage-data mutta ei Sheetsissa
  const showResume =
    savedInfo &&
    savedInfo.week === selectedWeek &&
    savedInfo.day === selectedDay &&
    !selectedInSheets

  return (
    <div className="start-screen">
      <div className="start-hero">
        <img
          src={`${import.meta.env.BASE_URL}icon-192-v2.png`}
          alt="Saliohjelma"
          className="start-logo"
        />
        <div className="start-title">Saliohjelma</div>
      </div>
      <div className="start-sub">{program.meso} · Valitse viikko ja päivä</div>

      {/* Resume-banneri — vain jos localStorage-data eikä Sheetsissa */}
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

      {/* Viikkonapit */}
      <div className="start-section">Viikko</div>
      <div className="start-grid">
        {program.weeks.map((w, i) => {
          const done = isWeekInSheets(i)
          return (
            <div
              key={i}
              className={`start-btn${selectedWeek === i ? ' selected' : ''}${done ? ' done' : ''}`}
              onClick={() => setSelectedWeek(i)}
            >
              <div className="start-btn-main">
                {done && <span className="done-check">✓ </span>}
                Viikko {i + 1}
              </div>
              <div className="start-btn-sub">RIR {w.rir} · {w.sets}+1</div>
            </div>
          )
        })}
      </div>

      {/* Päivänapit */}
      <div className="start-section">Päivä</div>
      <div className="start-grid">
        {program.days.map((day, di) => {
          const done = selectedWeek >= 0 && isDayInSheets(selectedWeek, di)
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

      {/* Aloitusalue */}
      {!ready ? (
        <button className="start-go" disabled>
          Aloita treeni →
        </button>
      ) : selectedInSheets ? (
        // Päivä löytyy Sheetsista
        <div className="start-saved-area">
          <div className="start-saved-label">✓ Tallennettu Sheetsiin</div>
          <div className="start-saved-btns">
            <button
              className="start-go ready start-go-view"
              onClick={() => onViewResults(selectedWeek, selectedDay)}
            >
              Katso tulokset
            </button>
            <button
              className="start-go-fresh"
              onClick={() => onStartFresh(selectedWeek, selectedDay)}
            >
              Aloita alusta
            </button>
          </div>
        </div>
      ) : (
        // Normaali aloitus
        <button
          className="start-go ready"
          onClick={() => onStart(selectedWeek, selectedDay)}
        >
          Aloita treeni →
        </button>
      )}
    </div>
  )
}
