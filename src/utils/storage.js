const WORKOUT_PREFIX = 'saliohjelma_treeni'
const BODYWEIGHT_KEY = 'saliohjelma_kehonpaino'

// ── Kehonpaino ──────────────────────────────────────────────────────────────

export function loadBodyweight() {
  const raw = localStorage.getItem(BODYWEIGHT_KEY)
  return raw ? parseFloat(raw) : null
}

export function saveBodyweight(kg) {
  localStorage.setItem(BODYWEIGHT_KEY, String(kg))
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
 */
export function saveWorkout(week, day, results) {
  const payload = {
    week,
    day,
    timestamp: new Date().toISOString(),
    results,
  }
  localStorage.setItem(workoutKey(week, day), JSON.stringify(payload))
}

/**
 * Lataa tallennetun treenin. Palauttaa null jos ei löydy.
 *
 * @returns {{ week, day, timestamp, results } | null}
 */
export function loadWorkout(week, day) {
  const raw = localStorage.getItem(workoutKey(week, day))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Tarkistaa onko jollekin viikolle/päivälle tallennettu keskeneräinen treeni.
 * Palauttaa { week, day, timestamp } tai null.
 */
export function findSavedWorkout() {
  for (let w = 0; w < 3; w++) {
    for (let d = 0; d < 3; d++) {
      const raw = localStorage.getItem(workoutKey(w, d))
      if (raw) {
        try {
          const { week, day, timestamp } = JSON.parse(raw)
          return { week, day, timestamp }
        } catch {
          // korruptoitunut data — ohitetaan
        }
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
