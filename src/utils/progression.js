import { loadWorkout } from './storage'

/**
 * Hakee toteutuneen tuloksen tietyltä viikolta/päivältä/liikkeeltä.
 *
 * type='bo'  → palauttaa back-off-setin toistot
 * type='aux' → palauttaa ensimmäisen suoritetun setin toistot
 */
function getPrevResult(weekIndex, dayIndex, exerciseIndex, type) {
  const saved = loadWorkout(weekIndex, dayIndex)
  if (!saved?.results?.[exerciseIndex]) return null
  const r = saved.results[exerciseIndex]
  if (type === 'bo') return r.bo ?? null
  return r.sets[0] ?? null
}

/**
 * Laskee progressiivisen toistotavoitteen.
 *
 * Viikko 0: baseTarget (program.json)
 * Viikko N: edellisen viikon tulos + 1, tai edellinen tavoite + 1 jos ei tulosta
 *
 * @param {number} baseTarget    - viikon 1 tavoite program.json:sta
 * @param {number} weekIndex     - nykyinen viikko (0-indeksoitu)
 * @param {number} dayIndex      - päivä (0-indeksoitu)
 * @param {number} exerciseIndex - liikkeen indeksi päivän sisällä
 * @param {'bo'|'aux'} type      - back-off vai apuliike
 * @returns {number}
 */
export function getProgressionTarget(baseTarget, weekIndex, dayIndex, exerciseIndex, type) {
  if (weekIndex === 0 || baseTarget == null) return baseTarget
  let target = baseTarget
  for (let w = 0; w < weekIndex; w++) {
    const actual = getPrevResult(w, dayIndex, exerciseIndex, type)
    target = actual != null ? actual + 1 : target + 1
  }
  return target
}
