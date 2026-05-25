/**
 * supersets.js
 *
 * Ryhmittelee päivän liikkeet supersettipareihin näytön renderöintiä
 * ja navigaatiota varten.
 *
 * Ryhmä syntyy kun:
 *   1. Liike A:n `supersetPari === liike B:n id`
 *   2. Liike B:n `supersetPari === liike A:n id`  (molemminpuolinen)
 *   3. A ja B ovat järjestyksessä peräkkäin program.days[d] -taulukossa
 *
 * Jos jokin ehto puuttuu → liike menee omaan ryhmäänsä yksinään.
 *
 * Tämä rajoittaa supersetin tarkoituksellisesti kahden mittaiseksi —
 * tripletit eivät ole ohjelmassa käytössä, ja niiden tuki vaatisi monimutkaisemman
 * graafiläpikäynnin.
 */

/**
 * @param  {Array<Object>} exercises  program.days[dayIndex]
 * @return {Array<Array<{exercise, index}>>}  Ryhmiä järjestyksessä.
 *   Jokainen ryhmä on taulukko jossa {exercise, alkuperäinen indeksi}.
 */
export function buildSupersetGroups(exercises) {
  const groups = []
  const consumed = new Set()

  for (let i = 0; i < exercises.length; i++) {
    if (consumed.has(i)) continue
    const a = exercises[i]
    const b = exercises[i + 1]

    const isMutualPair =
      b != null &&
      a.supersetPari != null &&
      b.id != null &&
      a.supersetPari === b.id &&
      b.supersetPari === a.id

    if (isMutualPair) {
      groups.push([
        { exercise: a, index: i },
        { exercise: b, index: i + 1 },
      ])
      consumed.add(i)
      consumed.add(i + 1)
    } else {
      groups.push([{ exercise: a, index: i }])
      consumed.add(i)
    }
  }

  return groups
}

/**
 * Etsii sen ryhmän indeksin joka sisältää annetun liikkeen.
 * @return {number}  ryhmän indeksi tai -1 jos ei löydy
 */
export function findGroupIndexContaining(groups, exerciseIndex) {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].some(item => item.index === exerciseIndex)) return i
  }
  return -1
}
