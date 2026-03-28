import React, { useState, useCallback } from 'react'
import { Dumbbell, ClipboardList, TrendingUp, Settings } from 'lucide-react'
import { useWorkout } from './hooks/useWorkout'
import { useTimer } from './hooks/useTimer'
import { loadBodyweight, loadTimerDuration } from './utils/storage'
import StartScreen from './components/StartScreen'
import WorkoutScreen from './components/WorkoutScreen'
import SummaryScreen from './components/SummaryScreen'
import ProgressScreen from './components/ProgressScreen'
import SettingsScreen from './components/SettingsScreen'
import TimerBar from './components/TimerBar'

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
  const [timerDuration, setTimerDuration] = useState(() => loadTimerDuration())
  const timer = useTimer(timerDuration)

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
    if (tab === 'workout') {
      setScreen(workoutHook.workout ? 'workout' : 'start')
    } else {
      setScreen(tab)
    }
  }, [workoutHook.workout])

  if (workoutHook.loading) return <LoadingScreen />
  if (workoutHook.error) return <ErrorScreen message={workoutHook.error} />

  // Kun taimeri on näkyvissä, MiniHeader offsettaa sen alle
  const timerOffset = timer.visible ? '61px' : '0px'

  return (
    <>
      <div
        className="main-content"
        style={{ '--mini-top': timerOffset }}
      >
        <TimerBar timer={timer} />

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
            timerStart={timer.start}
            bodyweight={bodyweight}
            onDoneSet={workoutHook.doneSet}
            onUndoSet={workoutHook.undoSet}
            onSkipSet={workoutHook.skipSet}
            onDoneBo={workoutHook.doneBo}
            onUndoBo={workoutHook.undoBo}
            onSkipBo={workoutHook.skipBo}
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
            timerDuration={timerDuration}
            onTimerDurationChange={setTimerDuration}
          />
        )}
      </div>

      <nav className="bottom-tabs">
          <button
            className={`btab${screen === 'workout' || screen === 'start' ? ' active' : ''}`}
            onClick={() => handleTabChange('workout')}
          >
            <Dumbbell size={22} />
            Treeni
          </button>
          <button
            className={`btab${screen === 'summary' ? ' active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            <ClipboardList size={22} />
            Yhteenveto
          </button>
          <button
            className={`btab${screen === 'progress' ? ' active' : ''}`}
            onClick={() => handleTabChange('progress')}
          >
            <TrendingUp size={22} />
            Kehitys
          </button>
          <button
            className={`btab${screen === 'settings' ? ' active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={22} />
            Asetukset
          </button>
      </nav>
    </>
  )
}
