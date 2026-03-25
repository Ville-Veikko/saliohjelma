import React, { useState, useCallback } from 'react'
import { useWorkout } from './hooks/useWorkout'
import { useTimer } from './hooks/useTimer'
import { loadBodyweight } from './utils/storage'
import StartScreen from './components/StartScreen'
import WorkoutScreen from './components/WorkoutScreen'
import SummaryScreen from './components/SummaryScreen'
import ProgressScreen from './components/ProgressScreen'
import SettingsScreen from './components/SettingsScreen'

function LoadingScreen() {
  return (
    <div style={{ padding: 32, color: '#666', fontSize: 14 }}>
      Ladataan ohjelmaa…
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{ padding: 32, color: '#f87171', fontSize: 14 }}>
      Virhe ohjelman latauksessa: {message}
    </div>
  )
}

export default function App() {
  const workoutHook = useWorkout()
  const timer = useTimer()

  // 'start' | 'workout' | 'summary' | 'progress' | 'settings'
  const [screen, setScreen] = useState('start')

  const [bodyweight, setBodyweight] = useState(() => loadBodyweight())

  const handleStartWorkout = useCallback((week, day) => {
    workoutHook.startWorkout(week, day)
    setScreen('workout')
  }, [workoutHook])

  const handleNext = useCallback(() => {
    const result = workoutHook.nextExercise()
    if (result === 'summary') setScreen('summary')
  }, [workoutHook])

  const handleSaved = useCallback(() => {
    workoutHook.markSaved()
  }, [workoutHook])

  const handleTabChange = useCallback((tab) => {
    setScreen(tab)
  }, [])

  if (workoutHook.loading) return <LoadingScreen />
  if (workoutHook.error) return <ErrorScreen message={workoutHook.error} />

  const showTabs = screen !== 'start'

  return (
    <>
      <div className="main-content">
        {screen === 'start' && (
          <StartScreen
            program={workoutHook.program}
            selectedWeek={workoutHook.selectedWeek}
            selectedDay={workoutHook.selectedDay}
            setSelectedWeek={workoutHook.setSelectedWeek}
            setSelectedDay={workoutHook.setSelectedDay}
            savedInfo={workoutHook.savedInfo}
            onStart={handleStartWorkout}
          />
        )}

        {screen === 'workout' && workoutHook.workout && (
          <WorkoutScreen
            program={workoutHook.program}
            workout={workoutHook.workout}
            timer={timer}
            bodyweight={bodyweight}
            onDoneSet={workoutHook.doneSet}
            onUndoSet={workoutHook.undoSet}
            onDoneBo={workoutHook.doneBo}
            onUndoBo={workoutHook.undoBo}
            onNext={handleNext}
            onPrev={workoutHook.prevExercise}
            onBack={() => setScreen('start')}
          />
        )}

        {screen === 'summary' && (
          <SummaryScreen
            program={workoutHook.program}
            workout={workoutHook.workout}
            bodyweight={bodyweight}
            onSaved={handleSaved}
          />
        )}

        {screen === 'progress' && (
          <ProgressScreen
            program={workoutHook.program}
            workout={workoutHook.workout}
            bodyweight={bodyweight}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            bodyweight={bodyweight}
            onBodyweightChange={setBodyweight}
          />
        )}
      </div>

      {showTabs && (
        <nav className="bottom-tabs">
          <button
            className={`btab${screen === 'workout' ? ' active' : ''}`}
            onClick={() => handleTabChange('workout')}
          >
            <div className="btab-icon">🏋️</div>
            Treeni
          </button>
          <button
            className={`btab${screen === 'summary' ? ' active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            <div className="btab-icon">📋</div>
            Yhteenveto
          </button>
          <button
            className={`btab${screen === 'progress' ? ' active' : ''}`}
            onClick={() => handleTabChange('progress')}
          >
            <div className="btab-icon">📈</div>
            Kehitys
          </button>
          <button
            className={`btab${screen === 'settings' ? ' active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <div className="btab-icon">⚙️</div>
            Asetukset
          </button>
        </nav>
      )}
    </>
  )
}
