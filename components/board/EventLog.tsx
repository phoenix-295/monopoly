'use client'

import { useEffect, useRef } from 'react'

export interface GameEvent {
  id: string
  text: string
  type?: 'system' | 'buy' | 'rent' | 'move' | 'jail' | 'card'
  timestamp: number
}

interface Props {
  events: GameEvent[]
}

const TYPE_COLOR: Record<string, string> = {
  system: 'var(--cream-dim)',
  buy:    '#22C55E',
  rent:   '#EF4444',
  move:   'var(--gold)',
  jail:   '#EC4899',
  card:   '#3B82F6',
}

const TYPE_ICON: Record<string, string> = {
  system: '•',
  buy:    '🏠',
  rent:   '💰',
  move:   '🎲',
  jail:   '🔒',
  card:   '🃏',
}

export default function EventLog({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div
      style={{
        background: 'var(--felt-card)',
        border: '2px solid var(--felt-border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--felt-border)',
          fontFamily: 'Playfair Display, serif',
          fontSize: '0.9rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--cream-dim)',
        }}
      >
        Event Log
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          minHeight: 120,
          maxHeight: 360,
        }}
      >
        {events.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', textAlign: 'center', padding: '1rem 0', opacity: 0.5 }}>
            Game events will appear here.
          </p>
        ) : (
          events.map(event => {
            const type = event.type ?? 'system'
            return (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  alignItems: 'flex-start',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                  animation: 'fadeIn 200ms var(--ease-out) forwards',
                }}
              >
                <span style={{ flexShrink: 0, fontSize: '0.75rem' }}>{TYPE_ICON[type]}</span>
                <span style={{ color: TYPE_COLOR[type] ?? 'var(--cream-dim)' }}>
                  {event.text}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
