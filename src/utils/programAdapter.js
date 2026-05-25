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

  // setteja_per_viikko ohjaa settimäärää viikkotasolla (esim. [3,3,4,5])
  // Jos kenttä puuttuu, käytetään oletusta 3 kaikille viikoille.
  const setteja_per_viikko = Array.isArray(raw.setteja_per_viikko)
    ? raw.setteja_per_viikko
    : null

  const weeks = raw.rir_per_viikko.map((rir, i) => ({
    rir,
    sets: setteja_per_viikko ? setteja_per_viikko[i] : 3,
  }))

  const dayKeys = Object.keys(raw.paivat).sort()
  const days = dayKeys.map(dk =>
    raw.paivat[dk].liikkeet.map(ex => adaptExercise(ex, viikkomaara, !!setteja_per_viikko))
  )

  return {
    meso,
    sheetsUrl: SHEETS_URL,
    weeks,
    days,
    // Salli history-kenttä uudessa formaatissa (manuaalinen siemennys PReja varten)
    history: raw.history ?? [],
    epleyProgress: {},
  }
}

function adaptExercise(ex, viikkomaara, hasSetsPerWeek) {
  const repeat = (v) => Array(viikkomaara).fill(v)
  const isLisaliike = ex.tyyppi === 'lisaliike'

  return {
    // id ja supersetPari pidetään mukana ryhmittelyä varten (utils/supersets.js)
    id: ex.id,
    supersetPari: ex.superset_pari ?? null,
    name: ex.nimi,
    badge: badgeFromExercise(ex),
    // Käytä raskas_kg:tä KAIKILLE liiketyypeille. Null vain jos JSONissa on
    // null (aito bw-liike kuten Leg raise tai Selkäpenkki).
    kg: repeat(ex.raskas_kg ?? null),
    boKg: null,
    rMin: isLisaliike ? ex.toistot_min : repeat(ex.toistot_min),
    rMax: isLisaliike ? ex.toistot_max : repeat(ex.toistot_max),
    boTarget: null,
    // Kun setteja_per_viikko ohjaa settimäärää, ei käytetä liikekohtaista
    // setsOverride-arvoa — getSetCount lukee silloin program.weeks[weekIndex].sets
    setsOverride: hasSetsPerWeek ? null : ex.setteja,
    // lisapaino = lisäpaino oman kehonpainon päälle (esim. +7.5 kg leuoissa)
    lisapaino: ex.lisapaino ?? false,
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
