import { useState, useEffect, useCallback } from 'react'
import {
  saveWorkout,
  loadWorkout,
  findSavedWorkout,
  clearWorkout,
} from '../utils/storage'

/**
 * Laskee tietyn liikkeen settimäärän ottaen huomioon setsOverride-kentän.
 */
export function getSetCount(program, weekIndex, exercise) {
  return exercise.setsOverride ?? program.weeks[weekIndex].sets
}

/**
 * Luo tyhjän results-rakenteen uudelle treenisessiolle.
 * results[i] = { sets: [null, null, ...], bo: null }
 */
function initResults(program, weekIndex, dayIndex) {
  return program.days[dayIndex].map(ex => ({
    sets: Array(getSetCount(program, weekIndex, ex)).fill(null),
    bo: null,
  }))
}

export function useWorkout() {
  // ── Ohjelma (fetch) ──────────────────────────────────────────────────────
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}program.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setProgram(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // ── Aloitusnäkymän valinnat ──────────────────────────────────────────────
  const [selectedWeek, setSelectedWeek] = useState(-1)
  const [selectedDay, setSelectedDay] = useState(-1)

  // Kesken oleva treeni localStoragessa (tarkistetaan ohjelman latauksen jälkeen)
  const [savedInfo, setSavedInfo] = useState(null)

  useEffect(() => {
    if (!program) return
    setSavedInfo(findSavedWorkout())
  }, [program])

  // ── Aktiivinen treeni ────────────────────────────────────────────────────
  // workout = { week, day, exerciseIndex, results }
  const [workout, setWorkout] = useState(null)

  /**
   * Päivittää results ja tallentaa localStorageen atomisesti.
   */
  const applyResults = useCallback((newResults, week, day) => {
    setWorkout(prev => ({ ...prev, results: newResults }))
    saveWorkout(week, day, newResults)
  }, [])

  /**
   * Aloittaa uuden treenin. Jos samalle viikolle/päivälle on tallennettu
   * data, ladataan se automaattisesti (resume-toiminto).
   */
  const startWorkout = useCallback((week, day) => {
    const saved = loadWorkout(week, day)
    const results = saved?.results ?? initResults(program, week, day)
    setWorkout({ week, day, exerciseIndex: 0, results })
  }, [program])

  // ── Settien kirjaaminen ──────────────────────────────────────────────────

  const doneSet = useCallback((exerciseIndex, setIndex, reps) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) => {
      if (i !== exerciseIndex) return r
      const newSets = [...r.sets]
      newSets[setIndex] = reps
      return { ...r, sets: newSets }
    })
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  const undoSet = useCallback((exerciseIndex, setIndex) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) => {
      if (i !== exerciseIndex) return r
      const newSets = [...r.sets]
      newSets[setIndex] = null
      return { ...r, sets: newSets }
    })
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  const skipSet = useCallback((exerciseIndex, setIndex) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) => {
      if (i !== exerciseIndex) return r
      const newSets = [...r.sets]
      newSets[setIndex] = 'skip'
      return { ...r, sets: newSets }
    })
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  const doneBo = useCallback((exerciseIndex, reps) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) =>
      i === exerciseIndex ? { ...r, bo: reps } : r
    )
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  const undoBo = useCallback((exerciseIndex) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) =>
      i === exerciseIndex ? { ...r, bo: null } : r
    )
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  const skipBo = useCallback((exerciseIndex) => {
    if (!workout) return
    const newResults = workout.results.map((r, i) =>
      i === exerciseIndex ? { ...r, bo: 'skip' } : r
    )
    applyResults(newResults, workout.week, workout.day)
  }, [workout, applyResults])

  // ── Navigointi ───────────────────────────────────────────────────────────

  const goToExercise = useCallback((index) => {
    setWorkout(prev => ({ ...prev, exerciseIndex: index }))
  }, [])

  const nextExercise = useCallback(() => {
    if (!workout || !program) return false
    const total = program.days[workout.day].length
    if (workout.exerciseIndex < total - 1) {
      setWorkout(prev => ({ ...prev, exerciseIndex: prev.exerciseIndex + 1 }))
      return 'next'
    }
    return 'summary'
  }, [workout, program])

  const prevExercise = useCallback(() => {
    if (!workout) return
    if (workout.exerciseIndex > 0) {
      setWorkout(prev => ({ ...prev, exerciseIndex: prev.exerciseIndex - 1 }))
    }
  }, [workout])

  // ── Sheets-tallennus ─────────────────────────────────────────────────────

  const markSaved = useCallback(() => {
    if (!workout) return
    clearWorkout(workout.week, workout.day)
    setSavedInfo(null)
  }, [workout])

  // ── Palautettu API ───────────────────────────────────────────────────────

  return {
    // ohjelma
    program,
    loading,
    error,

    // aloitusnäkymä
    selectedWeek,
    selectedDay,
    setSelectedWeek,
    setSelectedDay,
    savedInfo,

    // aktiivinen treeni
    workout,
    startWorkout,
    doneSet,
    undoSet,
    skipSet,
    doneBo,
    undoBo,
    skipBo,
    goToExercise,
    nextExercise,
    prevExercise,

    // tallennus
    markSaved,
  }
}
