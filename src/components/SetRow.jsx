import React, { useRef, useState } from 'react'
import Stepper from './Stepper'

const LONG_PRESS_MS = 1500

export default function SetRow({
  type,
  index,
  kgLabel,
  rMin,
  rMax,
  isDone,
  isSkipped,
  savedReps,
  onDone,
  onUndo,
  onSkip,
  onTimerStart,
}) {
  const stepperValRef = useRef(rMin)
  const pressTimerRef = useRef(null)
  const didLongPressRef = useRef(false)
  const [pressing, setPressing] = useState(false)

  function handleStepperChange(v) {
    stepperValRef.current = v
  }

  function handlePointerDown(e) {
    if (isDone || isSkipped) return
    e.preventDefault()
    didLongPressRef.current = false
    setPressing(true)
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true
      setPressing(false)
      onSkip?.()
    }, LONG_PRESS_MS)
  }

  function handlePointerUp() {
    clearTimeout(pressTimerRef.current)
    setPressing(false)
    if (didLongPressRef.current) {
      didLongPressRef.current = false
      return
    }
    if (isDone || isSkipped) {
      onUndo()
      return
    }
    onDone(stepperValRef.current)
    onTimerStart?.()
  }

  function handlePointerCancel() {
    clearTimeout(pressTimerRef.current)
    setPressing(false)
  }

  const isBo = type === 'bo'
  const label = isBo ? 'BO' : `S${index + 1}`

  let circleClass = 'circle-btn'
  if (isDone) circleClass += ' done'
  else if (isSkipped) circleClass += ' skipped'
  else if (pressing) circleClass += ' pressing'

  return (
    <div className={`set-row${isBo ? ' is-bo' : ''}${isDone ? ' is-done' : ''}${isSkipped ? ' is-skipped' : ''}`}>
      <div className={`set-num${isBo ? ' bo-num' : ''}`}>{label}</div>
      <div className={`set-kg-label${isDone ? ' active-kg' : ''}`}>{kgLabel}</div>

      <Stepper
        initValue={isDone ? savedReps : rMin}
        rMin={rMin}
        rMax={rMax}
        locked={isDone || isSkipped}
        onChange={handleStepperChange}
      />

      <button
        className={circleClass}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onContextMenu={e => e.preventDefault()}
      >
        {isDone && '✓'}
        {isSkipped && '−'}
      </button>
    </div>
  )
}
