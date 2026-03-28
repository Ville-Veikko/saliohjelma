import React, { useRef } from 'react'
import Stepper from './Stepper'

/**
 * Yksi settirivi — joko raskas setti (type='set') tai back-off (type='bo').
 * Tilat: null = odottaa, number = tehty, 'skip' = ohitettu
 */
export default function SetRow({
  type,          // 'set' | 'bo'
  index,         // settiindeksi (type='set') tai undefined (type='bo')
  kgLabel,       // näytettävä kg-teksti, esim. "92.5 kg" tai "bw"
  kgNum,         // numeerinen kg Epley-laskuun
  rMin,
  rMax,
  isDone,
  isSkipped,
  savedReps,     // null tai number — tallennettu arvo jos done
  onDone,        // (reps) => void
  onUndo,        // () => void
  onSkip,        // () => void
  onTimerStart,  // () => void
}) {
  const stepperValRef = useRef(rMin)

  function handleStepperChange(v) {
    stepperValRef.current = v
  }

  function handleDone() {
    if (isDone || isSkipped) {
      onUndo()
    } else {
      const reps = stepperValRef.current
      onDone(reps)
      onTimerStart?.()
    }
  }

  const isBo = type === 'bo'
  const label = isBo ? 'BO' : `S${index + 1}`

  if (isSkipped) {
    return (
      <div className={`set-row is-skipped${isBo ? ' is-bo' : ''}`}>
        <div className={`set-num${isBo ? ' bo-num' : ''}`}>{label}</div>
        <div className="set-kg-label">{kgLabel}</div>
        <div className="skip-label">Ohitettu</div>
        <button className="done-btn is-skipped-btn" onClick={handleDone}>
          ↩ Peru
        </button>
      </div>
    )
  }

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

      {!isDone && (
        <button className="skip-btn" onClick={() => onSkip?.()}>
          Ohita
        </button>
      )}

      <button
        className={`done-btn${isBo ? ' bo-color' : ''}${isDone ? ' is-done' : ''}`}
        onClick={handleDone}
      >
        {isDone ? `✓ ${savedReps}` : 'Tehty'}
      </button>
    </div>
  )
}
