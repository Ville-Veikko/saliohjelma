/**
 * programAdapter.js
 *
 * Sovituslogiikka uudelle JSON-skeemalle (M4/26 ja uudemmat).
 * Muuntaa uuden formaatin vanhan kaltaiseksi rakenteeksi jotta komponentit
 * (ExerciseCard, StartScreen, SummaryScreen, ProgressScreen) eivät vaadi muutoksia.
 *
 * Uusi formaatti tunnistetaan `rir_per_viikko` + `paivat` -kentistä.
 * Vanhat ohjelmat (`weeks`, `days`) palautuvat sellaisinaan.
 */

const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbxZG_4VmrwoJkSc4L3zk-rgF5oBlEG_5FSoWGw0BOgUF5oPg9E0FabysRprXovcFeA/exec'

export function isNewFormat(p) {
  return p && Array.isArray(p.rir_per_viikko) && p.paivat
}

export function adaptProgram(raw) {
  if (!isNewFormat(raw)) return raw

  const meso = typeof raw.meso === 'string' && raw.meso.startsWith('M')
    ? `Meso ${raw.meso.slice(1)}`
    : raw.meso

  const viikkomaara = raw.viikot
  const weeks = raw.rir_per_viikko.map(rir => ({ rir, sets: 3 }))

  const dayKeys = Object.keys(raw.paivat).sort()
  const days = dayKeys.map(dk =>
    raw.paivat[dk].liikkeet.map(ex => adaptExercise(ex, viikkomaara))
  )

  return {
    meso,
    sheetsUrl: SHEETS_URL,
    weeks,
    days,
    history: [],
    epleyProgress: {},
  }
}

function adaptExercise(ex, viikkomaara) {
  const repeat = (v) => Array(viikkomaara).fill(v)
  const isLisaliike = ex.tyyppi === 'lisaliike'

  return {
    name: ex.nimi,
    badge: badgeFromExercise(ex),
    kg: isLisaliike ? repeat(null) : repeat(ex.raskas_kg ?? null),
    boKg: null,
    rMin: isLisaliike ? ex.toistot_min : repeat(ex.toistot_min),
    rMax: isLisaliike ? ex.toistot_max : repeat(ex.toistot_max),
    boTarget: null,
    setsOverride: ex.setteja,
  }
}

function badgeFromExercise(ex) {
  if (ex.tyyppi === 'lisaliike') return 'apu'
  const id = ex.id || ''
  if (id.includes('penkki')) return 'penkki'
  if (id.includes('kyykky') || id === 'maastaveto') return 'kyykky'
  if (id.includes('leuat') || id.includes('soutu')) return 'leuat'
  return 'penkki'
}
