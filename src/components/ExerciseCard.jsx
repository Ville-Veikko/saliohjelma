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

export default function ExerciseCard({
  program,
  weekIndex,
  dayIndex,
  exerciseIndex,
  result,         // { sets: [null|reps|'skip', ...], bo: null|reps|'skip' }
  bodyweight,     // kg tai null — tarvitaan bw-liikkeille
  onDoneSet,      // (setIndex, reps) => void
  onUndoSet,      // (setIndex) => void
  onSkipSet,      // (setIndex) => void
  onDoneBo,       // (reps) => void
  onUndoBo,       // () => void
  onSkipBo,       // () => void
  onTimerStart,   // () => void
}) {
  const exercise = program.days[dayIndex][exerciseIndex]
  const week = program.weeks[weekIndex]
  const numSets = getSetCount(program, weekIndex, exercise)
  const hasBo = exercise.boKg !== null
  const isAux = exercise.badge === 'apu'

  // Progressiiviset toistotavoitteet
  const effectiveBoTarget = hasBo
    ? getProgressionTarget(exercise.boTarget, weekIndex, dayIndex, exerciseIndex, 'bo')
    : null
  const effectiveRepsTarget = isAux
    ? getProgressionTarget(exercise.rMin, weekIndex, dayIndex, exerciseIndex, 'aux')
    : null

  // Käytettävät rMin/rMax SetRow'lle
  const rMin = isAux ? effectiveRepsTarget : exercise.rMin
  const rMax = isAux ? effectiveRepsTarget : exercise.rMax

  // kg-arvot
  const kgRaw = exercise.kg[weekIndex]
  const kgNum = kgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(kgRaw) || 0

  const boKgRaw = exercise.boKg
  const boKgNum = boKgRaw === 'bw' ? (bodyweight ?? 0) : parseFloat(boKgRaw) || 0
  const boKgLabel = boKgRaw === 'bw' ? 'bw' : `${boKgRaw} kg`
  const kgLabel = kgRaw === 'bw' ? 'bw' : `${kgRaw} kg`

  // "Paras ±2.5kg" -haku
  const prev = kgNum ? getBestPrev(program.history, exercise.name, kgNum) : null
  const prevText = prev ? `${prev.kg} kg × ${prev.reps}` : '—'
  const prevSub  = prev ? `≈${epley(prev.kg, prev.reps) ?? '—'} kg 1RM` : ''

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
            <div className="info-val">{kgRaw === 'bw' ? 'bw' : `${kgRaw} kg`}</div>
            <div className="info-sub">
              {isAux ? `${effectiveRepsTarget} toistoa` : `${exercise.rMin}–${exercise.rMax} toistoa`}
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
            <div className="info-label">Paras ±2.5kg</div>
            <div className="info-val" style={{ fontSize: 13, color: '#fbbf24' }}>{prevText}</div>
            <div className="info-sub">{prevSub}</div>
          </div>
        </div>

        {Array.from({ length: numSets }, (_, i) => (
          <SetRow
            key={i}
            type="set"
            index={i}
            kgLabel={kgLabel}
            kgNum={kgNum}
            rMin={rMin}
            rMax={rMax}
            isDone={typeof result.sets[i] === 'number'}
            isSkipped={result.sets[i] === 'skip'}
            savedReps={typeof result.sets[i] === 'number' ? result.sets[i] : null}
            onDone={reps => onDoneSet(i, reps)}
            onUndo={() => onUndoSet(i)}
            onSkip={() => onSkipSet(i)}
            onTimerStart={onTimerStart}
          />
        ))}

        {/* Back-off */}
        {hasBo && (
          <SetRow
            type="bo"
            kgLabel={boKgLabel}
            kgNum={boKgNum}
            rMin={effectiveBoTarget}
            rMax={effectiveBoTarget}
            isDone={typeof result.bo === 'number'}
            isSkipped={result.bo === 'skip'}
            savedReps={typeof result.bo === 'number' ? result.bo : null}
            onDone={reps => onDoneBo(reps)}
            onUndo={() => onUndoBo()}
            onSkip={() => onSkipBo()}
            onTimerStart={onTimerStart}
          />
        )}
      </div>
    </div>
  )
}
