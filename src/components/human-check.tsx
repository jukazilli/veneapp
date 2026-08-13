'use client'

import { useState } from 'react'

export function HumanCheck({ items, token }: { items: string[]; token: string }) {
  const [selected, setSelected] = useState<number[]>([])

  function toggle(index: number) {
    setSelected(current => {
      if (current.includes(index)) return current.filter(item => item !== index)
      if (current.length >= 2) return [current[1], index]
      return [...current, index]
    })
  }

  return <div className="human-check">
    <div className="human-check-head">
      <div>
        <strong>Verificação rápida</strong>
        <div className="muted small">Selecione os dois objetos iguais.</div>
      </div>
      <span className={`human-count ${selected.length === 2 ? 'ready' : ''}`}>{selected.length}/2</span>
    </div>
    <div className="human-grid" role="group" aria-label="Selecione os dois objetos iguais">
      {items.map((item, index) => {
        const active = selected.includes(index)
        return <button
          key={`${item}-${index}`}
          type="button"
          className={`human-tile ${active ? 'selected' : ''}`}
          onClick={() => toggle(index)}
          aria-pressed={active}
          aria-label={`Objeto ${index + 1}`}
        >{item}</button>
      })}
    </div>
    <input type="hidden" name="human_token" value={token} />
    <input type="hidden" name="human_selection" value={[...selected].sort((a, b) => a - b).join(',')} />
  </div>
}
