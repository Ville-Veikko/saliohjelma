import React, { useEffect, useRef, useState } from 'react'
import MiniHeader from './MiniHeader'
import ExerciseCard from './ExerciseCard'
import { getSetCount } from '../hooks/useWorkout'

function calcSetProgress(program, workout) {
  const { week, day, results } = workout
  let total = 0, done = 0
  program.days[day].forEach((ex, i) => {
    const numSets = getSetCount(program, week, ex)
    total += numSets
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
  workout,
  timerStart,
  bodyweight,
  onDoneSet,
  onUndoSet,
  onSkipSet,
  onDoneBo,
  onUndoBo,
  onSkipBo,
  onNext,
  onPrev,
  onBack,
}) {
  const { week, day, exerciseIndex, results } = workout
  const exercises = program.days[day]
  const total = exercises.length
  const isFirst = exerciseIndex === 0
  const isLast = exerciseIndex === total - 1

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [exerciseIndex])

  // ── Slide-animaatio ─────────────────────────────────────────────────────
  const lastSwipeDirRef = useRef(null)
  const prevIndexRef = useRef(exerciseIndex)
  const [cardClass, setCardClass] = useState('')

  useEffect(() => {
    if (prevIndexRef.current === exerciseIndex) return
    const dir = lastSwipeDirRef.current
    if (dir === 'left') setCardClass('slide-from-right')
    else if (dir === 'right') setCardClass('slide-from-left')
    lastSwipeDirRef.current = null
    prevIndexRef.current = exerciseIndex
    const t = setTimeout(() => setCardClass(''), 260)
    return () => clearTimeout(t)
  }, [exerciseIndex])

  // ── Swipe-tunnistus ──────────────────────────────────────────────────────
  const swipeStartRef = useRef(null)
  const animatingRef = useRef(false)

  function handleSwipeStart(e) {
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleSwipeEnd(e) {
    if (!swipeStartRef.current || animatingRef.current) return
    const dx = e.clientX - swipeStartRef.current.x
    const dy = e.clientY - swipeStartRef.current.y
    swipeStartRef.current = null

    if (Math.abs(dx) < 60) return
    if (Math.abs(dx) < Math.abs(dy) * 2) return

    animatingRef.current = true
    setTimeout(() => { animatingRef.current = false }, 300)

    if (dx < 0) {
      // vasemmalle → seuraava (tai yhteenveto)
      lastSwipeDirRef.current = 'left'
      onNext()
    } else if (!isFirst) {
      // oikealle → edellinen
      lastSwipeDirRef.current = 'right'
      onPrev()
    }
  }

  function handleSwipeCancel() {
    swipeStartRef.current = null
  }

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

      {/* Pisteindikaattorit */}
      <div className="dot-indicators">
        {exercises.map((_, i) => (
          <div key={i} className={`dot${i === exerciseIndex ? ' active' : ''}`} />
        ))}
      </div>

      {/* Swipeable liike-kortti */}
      <div
        className={`swipe-area${cardClass ? ` ${cardClass}` : ''}`}
        onPointerDown={handleSwipeStart}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={handleSwipeCancel}
      >
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
      </div>

      {/* Yhteenveto-nappi vain viimeisellä liikkeellä */}
      {isLast && (
        <div className="nav-wrap">
          <button className="nav-btn nav-btn-finish" onClick={onNext} style={{ flex: 1 }}>
            Yhteenveto →
          </button>
        </div>
      )}
    </>
  )
}
