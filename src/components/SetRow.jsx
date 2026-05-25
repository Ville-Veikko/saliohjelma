import React, { useRef, useState, useEffect } from 'react'
import Stepper from './Stepper'

const LONG_PRESS_MS = 1500

export default function SetRow({
  type,
  index,
  kgLabel,
  kgNum,        // numeerinen oletuspaino (stepper-pohja)
  kgEditable,   // voiko käyttäjä muuttaa painoa?
  rMin,
  rMax,
  isDone,
  isSkipped,
  savedReps,
  savedKg,      // tallennettu kg kun setti on tehty (null = käytettiin oletusta)
  onDone,       // (reps, kg) => void
  onUndo,
  onSkip,
  onTimerStart,
}) {
  const stepperValRef = useRef(rMin)
  const pressTimerRef = useRef(null)
  const didLongPressRef = useRef(false)
  const [pressing, setPressing] = useState(false)
  const [customKg, setCustomKg] = useState(null)   // null = käytä kgNum
  const [kgEditOpen, setKgEditOpen] = useState(false)

  // Resetoi kg-muokkaus kun liike tai oletuspaino vaihtuu
  useEffect(() => {
    setCustomKg(null)
    setKgEditOpen(false)
  }, [kgNum])

  const effectiveKg = customKg ?? kgNum
  const isCustomized = customKg !== null && customKg !== kgNum

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
    setKgEditOpen(false)
    onDone(stepperValRef.current, effectiveKg)
    onTimerStart?.()
  }

  function handlePointerCancel() {
    clearTimeout(pressTimerRef.current)
    setPressing(false)
  }

  function handleKgToggle(e) {
    e.stopPropagation()
    if (isDone || isSkipped || !kgEditable) return
    setKgEditOpen(o => !o)
  }

  function adjustKg(delta) {
    setCustomKg(prev => {
      const base = prev ?? kgNum
      return Math.max(0, base + delta)
    })
  }

  const isBo = type === 'bo'
  const label = isBo ? 'BO' : `S${index + 1}`

  let circleClass = 'circle-btn'
  if (isDone) circleClass += ' done'
  else if (isSkipped) circleClass += ' skipped'
  else if (pressing) circleClass += ' pressing'

  // Mitä näytetään kg-labelissa
  const displayKgLabel = isDone
    ? (savedKg != null ? `${savedKg} kg` : kgLabel)
    : (kgEditable && (isCustomized || kgEditOpen))
      ? `${effectiveKg} kg`
      : kgLabel

  let kgClass = 'set-kg-label'
  if (isDone) {
    kgClass += ' active-kg'
    if (savedKg != null && savedKg !== kgNum) kgClass += ' kg-custom'
  } else if (!isSkipped) {
    if (kgEditable) kgClass += ' kg-editable'
    if (isCustomized) kgClass += ' kg-custom'
    if (kgEditOpen) kgClass += ' kg-editing'
  }

  const rowClass = `set-row${isBo ? ' is-bo' : ''}${isDone ? ' is-done' : ''}${isSkipped ? ' is-skipped' : ''}${kgEditOpen ? ' has-kg-edit' : ''}`

  return (
    <div className="set-row-wrap">
      <div className={rowClass}>
        <div className={`set-num${isBo ? ' bo-num' : ''}`}>{label}</div>

        <button className={kgClass} onClick={handleKgToggle} type="button">
          {displayKgLabel}
          {kgEditable && !isDone && !isSkipped && (
            <span className="kg-edit-icon">{kgEditOpen ? '▲' : '▼'}</span>
          )}
        </button>

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

      {kgEditOpen && (
        <div className="kg-edit-row">
          <button className="kg-edit-btn" onClick={() => adjustKg(-2.5)} type="button">−</button>
          <span className="kg-edit-val">{effectiveKg} kg</span>
          <button className="kg-edit-btn" onClick={() => adjustKg(+2.5)} type="button">+</button>
        </div>
      )}
    </div>
  )
}
