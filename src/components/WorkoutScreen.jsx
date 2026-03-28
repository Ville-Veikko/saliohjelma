import React, { useEffect } from 'react'
import MiniHeader from './MiniHeader'
import ExerciseCard from './ExerciseCard'
import { getSetCount } from '../hooks/useWorkout'

function calcSetProgress(program, workout) {
  const { week, day, results } = workout
  let total = 0, done = 0
  program.days[day].forEach((ex, i) => {
    const numSets = getSetCount(program, week, ex)
    total += numSets
    // v != null kattaa sekä number (tehty) että 'skip' (ohitettu)
    done += results[i].sets.slice(0, numSets).filter(v => v != null).length
    if (ex.boKg !== null) {
      total += 1
      if (results[i].bo != null) done += 1
    }
  })
  return { total, done }
}

export default function WorkoutScreen({
  program,
  workout,         // { week, day, exerciseIndex, results }
  timerStart,      // () => void — käynnistää taimerin
  bodyweight,
  onDoneSet,       // (exerciseIndex, setIndex, reps) => void
  onUndoSet,       // (exerciseIndex, setIndex) => void
  onSkipSet,       // (exerciseIndex, setIndex) => void
  onDoneBo,        // (exerciseIndex, reps) => void
  onUndoBo,        // (exerciseIndex) => void
  onSkipBo,        // (exerciseIndex) => void
  onNext,
  onPrev,
  onBack,
}) {
  const { week, day, exerciseIndex, results } = workout
  const exercises = program.days[day]
  const total = exercises.length
  const isFirst = exerciseIndex === 0
  const isLast = exerciseIndex === total - 1

  // Vieritetään ylös liikettä vaihdettaessa
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [exerciseIndex])

  const { total: setTotal, done: setDone } = calcSetProgress(program, workout)
  const pct = setTotal > 0 ? Math.round(setDone / setTotal * 100) : 0

  return (
    <>
      <MiniHeader program={program} weekIndex={week} dayIndex={day} onBack={onBack} />

      {/* Edistymispalkki */}
      <div className="progress-wrap">
        <div className="progress-label">
          <span>Liike {exerciseIndex + 1}/{total}</span>
          <span>{setDone}/{setTotal} settiä · {pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Liike-kortti */}
      <ExerciseCard
        program={program}
        weekIndex={week}
        dayIndex={day}
        exerciseIndex={exerciseIndex}
        result={results[exerciseIndex]}
        bodyweight={bodyweight}
        onDoneSet={(setIndex, reps) => onDoneSet(exerciseIndex, setIndex, reps)}
        onUndoSet={(setIndex) => onUndoSet(exerciseIndex, setIndex)}
        onSkipSet={(setIndex) => onSkipSet(exerciseIndex, setIndex)}
        onDoneBo={(reps) => onDoneBo(exerciseIndex, reps)}
        onUndoBo={() => onUndoBo(exerciseIndex)}
        onSkipBo={() => onSkipBo(exerciseIndex)}
        onTimerStart={timerStart}
      />

      {/* Navigointinapit */}
      <div className="nav-wrap">
        {!isFirst && (
          <button className="nav-btn nav-btn-prev" onClick={onPrev}>
            ← Edellinen
          </button>
        )}
        <button
          className={`nav-btn ${isLast ? 'nav-btn-finish' : 'nav-btn-next'}`}
          onClick={onNext}
          style={isFirst ? { flex: 1 } : {}}
        >
          {isLast ? 'Yhteenveto →' : 'Seuraava →'}
        </button>
      </div>
    </>
  )
}
