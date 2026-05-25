/**
 * progression.js
 *
 * RIR-progression laskenta. Periaate:
 *   - Viikko 1 = kalibrointi → näytetään ohjelman perustaso (baseline)
 *   - Viikko N → tavoite = (edellisen viikon saman setin actual) + 1
 *   - Jos edellistä dataa ei ole → fallback: baseline + weekIndex
 *
 * Data luetaan Sheets-historiasta (pysyvä lähde), ei localStoragesta.
 * localStorage tyhjenee Sheets-tallennuksen jälkeen — sieltä ei voi enää
 * lukea edellisen viikon tuloksia.
 */

import { loadWorkout } from './storage'

/**
 * Hakee tietyn setin tehdyn toistoluvun Sheets-historiasta.
 * Palauttaa numeron tai null.
 */
function getSheetsSetReps(sheetsData, weekIndex, dayIndex, exerciseName, setIndex) {
  if (!sheetsData) return null
  const key = `v${weekIndex + 1}_Day${dayIndex + 1}`
  const entry = sheetsData[key]
  if (!entry?.tulokset) return null
  const t = entry.tulokset.find(x => x.liike === exerciseName)
  if (!t) return null
  const val = t[`set${setIndex + 1}`]
  return typeof val === 'number' ? val : null
}

/**
 * Hakee back-off setin toiston Sheets-historiasta.
 */
function getSheetsBoReps(sheetsData, weekIndex, dayIndex, exerciseName) {
  if (!sheetsData) return null
  const key = `v${weekIndex + 1}_Day${dayIndex + 1}`
  const entry = sheetsData[key]
  if (!entry?.tulokset) return null
  const t = entry.tulokset.find(x => x.liike === exerciseName)
  if (!t) return null
  return typeof t.bo === 'number' ? t.bo : null
}

/**
 * Per-setti toistotavoite progressiolla.
 *
 *   V1: palautetaan baseline (kalibrointiviikko)
 *   V2+: kävelläään edellisten viikkojen läpi, kasvatetaan tavoitetta
 *        joko (actual + 1) tai (target + 1) jos dataa ei ole
 *
 * @param {Object} args
 * @param {Object|null} args.sheetsData    - Sheets-historiadata
 * @param {string}      args.exerciseName  - liikkeen nimi (suomeksi)
 * @param {number}      args.weekIndex     - 0-indeksoitu viikko
 * @param {number}      args.dayIndex      - 0-indeksoitu päivä
 * @param {number}      args.setIndex      - 0-indeksoitu setti
 * @param {number}      args.baseline      - ohjelman perustavoite (toistot_min)
 */
export function getSetTarget({ sheetsData, exerciseName, weekIndex, dayIndex, setIndex, baseline }) {
  if (weekIndex === 0 || baseline == null) return baseline

  let target = baseline
  for (let w = 0; w < weekIndex; w++) {
    const actual = getSheetsSetReps(sheetsData, w, dayIndex, exerciseName, setIndex)
    target = actual != null ? actual + 1 : target + 1
  }
  return target
}

/**
 * Per-setti back-off tavoite progressiolla. Sama logiikka kuin getSetTarget.
 */
export function getBoTarget({ sheetsData, exerciseName, weekIndex, dayIndex, baseline }) {
  if (weekIndex === 0 || baseline == null) return baseline

  let target = baseline
  for (let w = 0; w < weekIndex; w++) {
    const actual = getSheetsBoReps(sheetsData, w, dayIndex, exerciseName)
    target = actual != null ? actual + 1 : target + 1
  }
  return target
}

/**
 * Yleistavoiteen range info-boxiin: "10–15 toistoa" → "11–16" → "12–17" → "13–18"
 * Yksinkertainen siirtymä +weekIndex per viikko.
 */
export function getDisplayRange(baselineMin, baselineMax, weekIndex) {
  if (baselineMin == null || baselineMax == null) {
    return { min: baselineMin, max: baselineMax }
  }
  return {
    min: baselineMin + weekIndex,
    max: baselineMax + weekIndex,
  }
}

// ── Legacy-yhteensopivuus (vanha API) ──────────────────────────────────
// Pidetään vanha allekirjoitus käytettävissä jos jokin paikka kutsuu sitä.
// Ei käytetä enää uusissa komponenteissa.
function getPrevResultLegacy(weekIndex, dayIndex, exerciseIndex, type) {
  const saved = loadWorkout(weekIndex, dayIndex)
  if (!saved?.results?.[exerciseIndex]) return null
  const r = saved.results[exerciseIndex]
  if (type === 'bo') return r.bo ?? null
  return r.sets[0] ?? null
}

export function getProgressionTarget(baseTarget, weekIndex, dayIndex, exerciseIndex, type) {
  if (weekIndex === 0 || baseTarget == null) return baseTarget
  let target = baseTarget
  for (let w = 0; w < weekIndex; w++) {
    const actual = getPrevResultLegacy(w, dayIndex, exerciseIndex, type)
    target = actual != null ? actual + 1 : target + 1
  }
  return target
}
