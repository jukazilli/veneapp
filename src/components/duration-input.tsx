'use client'

import { useState } from 'react'
import { formatDurationHHMM, normalizeDurationTyping } from '@/lib/duration'

export function DurationInput({
  defaultMinutes,
  value,
  onValueChange,
}: {
  defaultMinutes: number
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = useState(formatDurationHHMM(defaultMinutes))
  const currentValue = value ?? internalValue

  return <input
    className="input time-input"
    name="duration_hhmm"
    type="text"
    inputMode="numeric"
    autoComplete="off"
    maxLength={5}
    pattern="\d{2}:[0-5]\d"
    placeholder="00:30"
    title="Digite a duração no formato HH:MM, por exemplo 00:30 ou 01:00."
    value={currentValue}
    onChange={event => {
      const nextValue = normalizeDurationTyping(event.target.value)
      if (value === undefined) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }}
    required
  />
}
