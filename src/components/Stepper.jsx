import React, { useState, useEffect } from 'react'
import { stepperColor } from '../utils/epley'

/**
 * Numerosyötin (−/luku/+) joka hallinnoi arvon omassa tilassaan.
 * Kutsuu onChange aina kun arvo muuttuu.
 * Deaktivoituu kun locked=true.
 */
export default function Stepper({ initValue, rMin, rMax, locked, onChange }) {
  const [value, setValue] = useState(initValue ?? rMin)

  // Kun initValue muuttuu ulkoapäin (esim. navigointi liikkeiden välillä),
  // resetataan lokaaliarvo
  useEffect(() => {
    if (initValue != null) setValue(initValue)
  }, [initValue])

  function change(delta) {
    if (locked) return
    setValue(prev => {
      const next = Math.max(1, Math.min(30, prev + delta))
      onChange?.(next)
      return next
    })
  }

  // Ennen lukitsemista numero on aina valkoinen (color-target)
  const colorClass = locked
    ? stepperColor(value, rMin, rMax, false)
    : 'color-target'

  return (
    <div className="stepper">
      <button
        className="step-btn"
        onClick={() => change(-1)}
        disabled={locked}
        aria-label="Vähennä"
      >
        −
      </button>
      <div className={`step-number ${colorClass}`}>{value}</div>
      <button
        className="step-btn"
        onClick={() => change(1)}
        disabled={locked}
        aria-label="Lisää"
      >
        +
      </button>
    </div>
  )
}
