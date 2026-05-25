import React, { useEffect, useRef, useState } from 'react'
import MiniHeader from './MiniHeader'
import ExerciseCard from './ExerciseCard'
import { getSetCount } from '../hooks/useWorkout'
import { buildSupersetGroups, findGroupIndexContaining } from '../utils/supersets'

function calcSetProgress(program, workout) {
  const { week, day, results } = workout
  let total = 0, done = 0
  program.days[day].forEach((ex, i) => {
    const numSets = getSetCount(program, week, ex)
    total += numSets
    const r = results[i]
    if (r?.sets) {
      done += r.sets.slice(0, numSets).filter(v => v != null).length
    }
    if (ex.boKg !== null) {
      total += 1
      if (r?.bo != null) done += 1
    }
  })
  return { total, done }
}

export default function WorkoutScreen({
  program,
  workout,
  timerStart,
  bodyweight,
  sheetsData,
  goToExercise,
  onSummary,
  onBack,
  onDoneSet,
  onUndoSet,
  onSkipSet,
  onDoneBo,
  onUndoBo,
  onSkipBo,
}) {
  const { week, day, exerciseIndex, results } = workout
  const exercises = program.days[day]

  // ── Superset-ryhmittely ─────────────────────────────────────────────────
  const groups = buildSupersetGroups(exercises)
  const currentGroupIdx = Math.max(0, findGroupIndexContaining(groups, exerciseIndex))
  const currentGroup = groups[currentGroupIdx]
  const isFirstGroup = currentGroupIdx === 0
  const isLastGroup  = currentGroupIdx === groups.length - 1
  const isSuperset   = currentGroup.length > 1

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentGroupIdx])

  // ── Ryhmänavigaatio ─────────────────────────────────────────────────────
  function goNext() {
    if (isLastGroup) {
      onSummary()
    } else {
      const next = groups[currentGroupIdx + 1]
      goToExercise(next[0].index)
    }
  }

  function goPrev() {
    if (!isFirstGroup) {
      const prev = groups[currentGroupIdx - 1]
      goToExercise(prev[0].index)
    }
  }

  // ── Slide-animaatio ─────────────────────────────────────────────────────
  const lastSwipeDirRef = useRef(null)
  const prevGroupRef = useRef(currentGroupIdx)
  const [cardClass, setCardClass] = useState('')

  useEffect(() => {
    if (prevGroupRef.current === currentGroupIdx) return
    const dir = lastSwipeDirRef.current
    if (dir === 'left') setCardClass('slide-from-right')
    else if (dir === 'right') setCardClass('slide-from-left')
    lastSwipeDirRef.current = null
    prevGroupRef.current = currentGroupIdx
    const t = setTimeout(() => setCardClass(''), 260)
    return () => clearTimeout(t)
  }, [currentGroupIdx])

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
      lastSwipeDirRef.current = 'left'
      goNext()
    } else if (!isFirstGroup) {
      lastSwipeDirRef.current = 'right'
      goPrev()
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

      {/* Edistymispalkki — laskee ryhmiä, ei yksittäisiä liikkeitä */}
      <div className="progress-wrap">
        <div className="progress-label">
          <span>Liike {currentGroupIdx + 1}/{groups.length}</span>
          <span>{setDone}/{setTotal} settiä · {pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Pisteindikaattorit — yksi per ryhmä */}
      <div className="dot-indicators">
        {groups.map((_, i) => (
          <div key={i} className={`dot${i === currentGroupIdx ? ' active' : ''}`} />
        ))}
      </div>

      {/* Swipeable ryhmäkortti */}
      <div
        className={`swipe-area${cardClass ? ` ${cardClass}` : ''}`}
        onPointerDown={handleSwipeStart}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={handleSwipeCancel}
      >
        {isSuperset && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              letterSpacing: 1.5,
              fontWeight: 700,
              color: '#fbbf24',
              padding: '8px 0 4px',
            }}
          >
            ⚡ SUPERSET — {currentGroup.map(g => g.exercise.name).join(' / ')}
          </div>
        )}

        {currentGroup.map(({ exercise, index }) => (
          <ExerciseCard
            key={index}
            program={program}
            weekIndex={week}
            dayIndex={day}
            exerciseIndex={index}
            result={results[index]}
            bodyweight={bodyweight}
            sheetsData={sheetsData}
            onDoneSet={(setIndex, reps, kg) => onDoneSet(index, setIndex, reps, kg)}
            onUndoSet={(setIndex) => onUndoSet(index, setIndex)}
            onSkipSet={(setIndex) => onSkipSet(index, setIndex)}
            onDoneBo={(reps, kg) => onDoneBo(index, reps, kg)}
            onUndoBo={() => onUndoBo(index)}
            onSkipBo={() => onSkipBo(index)}
            onTimerStart={timerStart}
          />
        ))}
      </div>

      {/* Yhteenveto-nappi vain viimeisellä ryhmällä */}
      {isLastGroup && (
        <div className="nav-wrap">
          <button className="nav-btn nav-btn-finish" onClick={goNext} style={{ flex: 1 }}>
            Yhteenveto →
          </button>
        </div>
      )}
    </>
  )
}
