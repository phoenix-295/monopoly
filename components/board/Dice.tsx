'use client'

import { useState } from 'react'

interface Props {
  values?: [number, number]
  disabled?: boolean
  onRoll?: (values: [number, number]) => void
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
}

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        background: '#fff',
        borderRadius: 10,
        border: '2px solid var(--felt-border)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        position: 'relative',
        transition: 'transform 200ms var(--ease-out)',
        transform: rolling ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        flexShrink: 0,
      }}
    >
      {(DOTS[value] ?? DOTS[1]).map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--cream)',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}

export default function Dice({ values = [1, 1], disabled = false, onRoll }: Props) {
  const [rolling, setRolling] = useState(false)
  const [current, setCurrent] = useState<[number, number]>(values)

  function roll() {
    if (rolling || disabled || !onRoll) return
    setRolling(true)
    const interval = setInterval(() => {
      setCurrent([
        Math.ceil(Math.random() * 6) as number,
        Math.ceil(Math.random() * 6) as number,
      ] as [number, number])
    }, 80)
    setTimeout(() => {
      clearInterval(interval)
      const result: [number, number] = [
        Math.ceil(Math.random() * 6) as number,
        Math.ceil(Math.random() * 6) as number,
      ] as [number, number]
      setCurrent(result)
      setRolling(false)
      onRoll(result)
    }, 600)
  }

  const display = rolling ? current : values

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Die value={display[0]} rolling={rolling} />
        <Die value={display[1]} rolling={rolling} />
      </div>
      {onRoll && (
        <button
          onClick={roll}
          disabled={disabled || rolling}
          className="btn-gold"
          style={{ padding: '0.4rem 1.2rem', fontSize: '0.8rem' }}
        >
          {rolling ? 'Rolling…' : 'Roll Dice'}
        </button>
      )}
      {display[0] === display[1] && !rolling && (
        <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.05em' }}>
          DOUBLES!
        </span>
      )}
    </div>
  )
}
