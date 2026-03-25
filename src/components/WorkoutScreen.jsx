import React, { useEffect } from 'react'
import MiniHeader from './MiniHeader'
import TimerBar from './TimerBar'
import ExerciseCard from './ExerciseCard'

export default function WorkoutScreen({
  program,
  workout,         // { week, day, exerciseIndex, results }
  timer,
  bodyweight,
  onDoneSet,       // (exerciseIndex, setIndex, reps) => void
  onUndoSet,       // (exerciseIndex, setIndex) => void
  onDoneBo,        // (exerciseIndex, reps) => void
  onUndoBo,        // (exerciseIndex) => void
  onNext,          // () => void — voi siirtyä yhteenvetoon
  onPrev,          // () => void
  onBack,          // () => void — takaisin aloitusnäkymään
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

  const pct = Math.round((exerciseIndex + 1) / total * 100)

  return (
    <>
      <MiniHeader program={program} weekIndex={week} dayIndex={day} onBack={onBack} />

      <TimerBar timer={timer} />

      {/* Edistymispalkki */}
      <div className="progress-wrap">
        <div className="progress-label">
          <span>Liike {exerciseIndex + 1}/{total}</span>
          <span>{pct}%</span>
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
        onDoneBo={(reps) => onDoneBo(exerciseIndex, reps)}
        onUndoBo={() => onUndoBo(exerciseIndex)}
        onTimerStart={timer.start}
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
