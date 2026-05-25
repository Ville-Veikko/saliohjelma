import React from 'react'
import SetRow from './SetRow'
import { getBestPrev, epley } from '../utils/epley'
import { getSetCount } from '../hooks/useWorkout'
import { getProgressionTarget } from '../utils/progression'

const BADGE_LABELS = {
  penkki: 'Pääliike',
  kyykky: 'Pääliike',
  leuat:  'Pääliike',
  apu:    'Apuliike',
}

// ── Apufunktiot result-arvojen lukemiseen (tukee molempia formaatteja) ──────

/** Onko setti tehty (uusi {reps,kg} tai vanha numero) */
function isSetDone(v) {
  if (v == null || v === 'skip') return false
  if (typeof v === 'number') return true      // legacy
  return typeof v === 'object'               // uusi: { reps, kg }
}

/** Palauttaa toistot riippumatta formaatista */
function getSetReps(v) {
  if (v == null || v === 'skip') return null
  if (typeof v === 'number') return v          // legacy
  return v.reps ?? null
}

/** Palauttaa tallennetun kg:n tai null jos ei muutettu (legacy tai sama kuin ohjelma) */
function getSetKg(v) {
  if (typeof v === 'object' && v !== null && v !== 'skip') return v.kg ?? null
  return null  // legacy: ei kg-tietoa tallennettu
}

export default function ExerciseCard({
  program,
  weekIndex,
  dayIndex,
  exerciseIndex,
  result,         // { sets: [null|reps|'skip'|{reps,kg}, ...], bo: null|reps|'skip'|{reps,kg} }
  bodyweight,     // kg tai null — tarvitaan bw-liikkeille
  onDoneSet,      // (setIndex, reps, kg) => void
  onUndoSet,      // (setIndex) => void
  onSkipSet,      // (setIndex) => void
  onDoneBo,       // (reps, kg) => void
  onUndoBo,       // () => void
  onSkipBo,       // () => void
  onTimerStart,   // () => void
}) {
  const exercise = program.days[dayIndex][exerciseIndex]
  // Defensiivinen guard: jos liike tai result puuttuu, ei renderöidä mitään
  if (!exercise || !result) return null
  const week = program.weeks[weekIndex]
  const numSets = getSetCount(program, weekIndex, exercise)
  const hasBo = exercise.boKg !== null
  const isAux = exercise.badge === 'apu'

  // Tuki sekä skalaari- että taulukkomuotoisille arvoille
  const pw = (val) => Array.isArray(val) ? val[weekIndex] : val

  // Progressiiviset toistotavoitteet (apuliikkeet)
  const boTargetBase = Array.isArray(exercise.boTarget) ? exercise.boTarget[0] : exercise.boTarget
  const rMinBase = Array.isArray(exercise.rMin) ? exercise.rMin[0] : exercise.rMin

  const effectiveBoTarget = hasBo
    ? getProgressionTarget(boTargetBase, weekIndex, dayIndex, exerciseIndex, 'bo')
    : null
  const effectiveRepsTarget = isAux
    ? getProgressionTarget(rMinBase, weekIndex, dayIndex, exerciseIndex, 'aux')
    : null

  // Käytettävät rMin/rMax SetRow'lle
  const rMin = isAux ? effectiveRepsTarget : pw(exercise.rMin)
  const rMax = isAux ? effectiveRepsTarget : pw(exercise.rMax)

  // kg-arvot
  const kgRaw = exercise.kg[weekIndex]
  const kgNum = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0

  const boKgRaw = exercise.boKg
  const boKgNum = boKgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(boKgRaw) || 0
  const boKgLabel = boKgRaw === 'bw' ? 'bw' : `${boKgRaw} kg`
  // lisapaino = lisäpaino oman kehonpainon päälle (esim. leuat +7.5 kg)
  const kgLabel = kgRaw === 'bw' ? 'bw'
    : kgRaw == null ? '—'
    : exercise.lisapaino ? `+${kgRaw} kg`
    : `${kgRaw} kg`

  // "Paras ±2.5kg" -haku
  const prev = kgNum ? getBestPrev(program.history, exercise.name, kgNum) : null
  const prevText = prev ? `${prev.kg} kg × ${prev.reps}` : '—'
  const prevSub  = prev ? `≈${epley(prev.kg, prev.reps) ?? '—'} kg` : ''

  return (
    <div className="exercise-wrap">
      <div className="exercise-card">
        {/* Otsikkorivi */}
        <div className="exercise-header">
          <div className="exercise-name">{exercise.name}</div>
          <div className="ex-right">
            <div className={`ex-badge badge-${exercise.badge}`}>
              {BADGE_LABELS[exercise.badge] ?? exercise.badge}
            </div>
            <div className="ex-rir">RIR {week.rir}</div>
          </div>
        </div>

        {/* Infoboksit */}
        <div className="info-row">
          <div className="info-box">
            <div className="info-label">Raskas</div>
            <div className="info-val">{kgLabel}</div>
            <div className="info-sub">
              {isAux ? `${effectiveRepsTarget} toistoa` : `${pw(exercise.rMin)}–${pw(exercise.rMax)} toistoa`}
            </div>
          </div>

          {hasBo ? (
            <div className="info-box">
              <div className="info-label">Back-off</div>
              <div className="info-val" style={{ color: '#4ade80' }}>
                {boKgRaw === 'bw' ? 'bw' : `${boKgRaw} kg`}
              </div>
              <div className="info-sub">{effectiveBoTarget} toistoa</div>
            </div>
          ) : (
            <div className="info-box">
              <div className="info-label">Settiä</div>
              <div className="info-val">{numSets} kpl</div>
              <div className="info-sub">&nbsp;</div>
            </div>
          )}

          <div className="info-box">
            <div className="info-label">PR</div>
            <div className="info-val" style={{ fontSize: 13, color: '#fbbf24' }}>{prevText}</div>
            <div className="info-sub">{prevSub}</div>
          </div>
        </div>

        {Array.from({ length: numSets }, (_, i) => {
          const setVal = result.sets[i]
          return (
            <SetRow
              key={i}
              type="set"
              index={i}
              kgLabel={kgLabel}
              kgNum={kgNum}
              kgEditable={kgRaw !== 'bw'}
              rMin={rMin}
              rMax={rMax}
              isDone={isSetDone(setVal)}
              isSkipped={setVal === 'skip'}
              savedReps={getSetReps(setVal)}
              savedKg={getSetKg(setVal)}
              onDone={(reps, kg) => onDoneSet(i, reps, kg)}
              onUndo={() => onUndoSet(i)}
              onSkip={() => onSkipSet(i)}
              onTimerStart={onTimerStart}
            />
          )
        })}

        {/* Back-off */}
        {hasBo && (
          <SetRow
            type="bo"
            kgLabel={boKgLabel}
            kgNum={boKgNum}
            kgEditable={boKgRaw !== 'bw'}
            rMin={effectiveBoTarget}
            rMax={effectiveBoTarget}
            isDone={isSetDone(result.bo)}
            isSkipped={result.bo === 'skip'}
            savedReps={getSetReps(result.bo)}
            savedKg={getSetKg(result.bo)}
            onDone={(reps, kg) => onDoneBo(reps, kg)}
            onUndo={() => onUndoBo()}
            onSkip={() => onSkipBo()}
            onTimerStart={onTimerStart}
          />
        )}
      </div>
    </div>
  )
}
