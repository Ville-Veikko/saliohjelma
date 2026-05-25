const WORKOUT_PREFIX = 'saliohjelma_treeni'
const BODYWEIGHT_KEY = 'saliohjelma_kehonpaino'
const TIMER_KEY = 'saliohjelma_timer_kesto'
const TIMER_DEFAULT = 120
const ACTIVE_EXERCISE_KEY = 'saliohjelma_aktiivinen_liike'

// ── Kehonpaino ──────────────────────────────────────────────────────────────

export function loadBodyweight() {
  const raw = localStorage.getItem(BODYWEIGHT_KEY)
  return raw ? parseFloat(raw) : null
}

export function saveBodyweight(kg) {
  localStorage.setItem(BODYWEIGHT_KEY, String(kg))
}

export function loadTimerDuration() {
  const raw = localStorage.getItem(TIMER_KEY)
  return raw ? parseInt(raw, 10) : TIMER_DEFAULT
}

export function saveTimerDuration(seconds) {
  localStorage.setItem(TIMER_KEY, String(seconds))
}

// ── Aktiivinen liike ────────────────────────────────────────────────────────

export function saveActiveExercise(index) {
  localStorage.setItem(ACTIVE_EXERCISE_KEY, String(index))
}

export function loadActiveExercise() {
  const raw = localStorage.getItem(ACTIVE_EXERCISE_KEY)
  return raw !== null ? parseInt(raw, 10) : 0
}

export function clearActiveExercise() {
  localStorage.removeItem(ACTIVE_EXERCISE_KEY)
}

// ── Treeni ──────────────────────────────────────────────────────────────────

function workoutKey(week, day) {
  return `${WORKOUT_PREFIX}_${week}_${day}`
}

/**
 * Tallentaa kesken olevan treenin tilan.
 *
 * @param {number} week    - 0-indeksoitu viikko
 * @param {number} day     - 0-indeksoitu päivä
 * @param {Array}  results - results[exerciseIndex] = { sets: [r|null, ...], bo: r|null }
 * @param {string} meso    - ohjelman meso-nimi (esim. "Meso 4/26") schema-tunnistusta varten
 */
export function saveWorkout(week, day, results, meso) {
  const payload = {
    meso,
    week,
    day,
    timestamp: new Date().toISOString(),
    results,
  }
  localStorage.setItem(workoutKey(week, day), JSON.stringify(payload))
}

/**
 * Lataa tallennetun treenin. Palauttaa null jos ei löydy tai meso ei täsmää.
 *
 * @param {number} week
 * @param {number} day
 * @param {string} currentMeso - jos annettu, palauttaa null mikäli saved.meso eri
 * @returns {{ meso, week, day, timestamp, results } | null}
 */
export function loadWorkout(week, day, currentMeso) {
  const raw = localStorage.getItem(workoutKey(week, day))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Hylkää eri mesojen data (uudet tallennukset sisältävät meso-kentän)
    if (currentMeso && parsed.meso && parsed.meso !== currentMeso) return null
    // Legacy-tallennukset ilman meso-kenttää: hyväksy, mutta startWorkout
    // tarkistaa vielä results.length vastaavuuden ennen käyttöä
    return parsed
  } catch {
    return null
  }
}

/**
 * Tarkistaa onko jollekin viikolle/päivälle tallennettu keskeneräinen treeni
 * NYKYISESSÄ ohjelmassa. Tarkistaa että meso täsmää ja results.length vastaa
 * päivän liikkeiden määrää (suojaa skeemavaihdoksilta).
 *
 * @param {Object} program - { meso, weeks, days }
 * @returns {{ week, day, timestamp } | null}
 */
export function findSavedWorkout(program) {
  if (!program?.weeks || !program?.days) return null
  const currentMeso = program.meso

  for (let w = 0; w < program.weeks.length; w++) {
    for (let d = 0; d < program.days.length; d++) {
      const raw = localStorage.getItem(workoutKey(w, d))
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        // Hylkää eri mesojen data jos meso-tieto on tallennettu
        if (parsed.meso && parsed.meso !== currentMeso) continue
        // Liike-lukumäärän on täsmättävä (turva-aita schema-vaihtoehdolle, kattaa myös legacy-entryt)
        if (!Array.isArray(parsed.results)) continue
        if (parsed.results.length !== program.days[d].length) continue
        return { week: parsed.week, day: parsed.day, timestamp: parsed.timestamp }
      } catch {
        // korruptoitunut data — ohitetaan
      }
    }
  }
  return null
}

/**
 * Poistaa tallennetun treenin (kutsutaan onnistuneen Sheets-tallennuksen jälkeen).
 */
export function clearWorkout(week, day) {
  localStorage.removeItem(workoutKey(week, day))
}

/**
 * Palauttaa suoritettujen settien osuuden (0–1) tietylle viikolle/päivälle.
 * Laskee suoraan results-rakenteen perusteella — ei tarvitse program-dataa.
 */
export function getDayProgress(week, day) {
  const saved = loadWorkout(week, day)
  if (!saved?.results) return 0
  let total = 0
  let done = 0
  saved.results.forEach(r => {
    total += r.sets.length
    done  += r.sets.filter(v => v != null).length
  })
  return total > 0 ? done / total : 0
}
