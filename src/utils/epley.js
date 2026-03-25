/**
 * Epley 1RM -arvio: kg × (1 + toistot / 30)
 * Palauttaa null jos syötteet ovat virheellisiä tai toistoja < 1.
 */
export function epley(kg, reps) {
  const k = parseFloat(kg)
  const r = parseFloat(reps)
  if (!k || !r || r < 1) return null
  return Math.round(k * (1 + r / 30) * 10) / 10
}

/**
 * Hakee historiadatasta parhaan (korkein Epley) setin
 * jonka paino on ±2.5 kg annetusta targetKg:sta.
 *
 * @param {Array}  history  - program.json:n history-taulukko
 * @param {string} name     - liikkeen nimi
 * @param {number} targetKg - nykyinen raskas kg
 * @returns {{ kg, reps, epley1rm } | null}
 */
export function getBestPrev(history, name, targetKg) {
  const tKg = parseFloat(targetKg)
  if (!tKg || !history?.length) return null

  const matches = history.filter(
    h => h.name === name && Math.abs(h.kg - tKg) <= 2.5
  )
  if (!matches.length) return null

  return matches.reduce((best, h) => {
    const e = epley(h.kg, h.reps) ?? 0
    const be = epley(best.kg, best.reps) ?? 0
    return e > be ? h : best
  })
}

/**
 * Palauttaa stepper-numeron väriluokan suhteessa tavoitteeseen.
 *
 * @param {number}  val    - nykyinen arvo
 * @param {number}  rMin   - tavoitteen alaraja
 * @param {number}  rMax   - tavoitteen yläraja (back-offilla sama kuin rMin)
 * @param {boolean} isPending - ei vielä syötetty
 */
export function stepperColor(val, rMin, rMax, isPending) {
  if (isPending) return 'color-pending'
  const v = parseInt(val)
  if (isNaN(v)) return 'color-pending'
  if (v >= rMin && v <= rMax) return 'color-target'
  return v > rMax ? 'color-above' : 'color-below'
}
