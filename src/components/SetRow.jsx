import React, { useRef } from 'react'
import Stepper from './Stepper'

/**
 * Yksi settirivi — joko raskas setti (type='set') tai back-off (type='bo').
 */
export default function SetRow({
  type,          // 'set' | 'bo'
  index,         // settiindeksi (type='set') tai undefined (type='bo')
  kgLabel,       // näytettävä kg-teksti, esim. "92.5 kg" tai "bw"
  kgNum,         // numeerinen kg Epley-laskuun
  rMin,
  rMax,
  isDone,
  savedReps,     // null tai number — tallennettu arvo jos done
  onDone,        // (reps) => void
  onUndo,        // () => void
  onTimerStart,  // () => void
}) {
  const stepperValRef = useRef(rMin)

  function handleStepperChange(v) {
    stepperValRef.current = v
  }

  function handleDone() {
    if (isDone) {
      onUndo()
    } else {
      const reps = stepperValRef.current
      onDone(reps)
      onTimerStart?.()
    }
  }

  const isBo = type === 'bo'
  const label = isBo ? 'BO' : `S${index + 1}`

  return (
    <div className={`set-row${isBo ? ' is-bo' : ''}${isDone ? ' is-done' : ''}`}>
      <div className={`set-num${isBo ? ' bo-num' : ''}`}>{label}</div>
      <div className={`set-kg-label${isDone ? ' active-kg' : ''}`}>{kgLabel}</div>

      <Stepper
        initValue={isDone ? savedReps : rMin}
        rMin={rMin}
        rMax={rMax}
        locked={isDone}
        onChange={handleStepperChange}
      />

      <button
        className={`done-btn${isBo ? ' bo-color' : ''}${isDone ? ' is-done' : ''}`}
        onClick={handleDone}
      >
        {isDone ? `✓ ${savedReps}` : 'Tehty'}
      </button>
    </div>
  )
}
