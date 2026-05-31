'use client'

import { useEffect, useRef, useState } from 'react'

export interface GameEvent {
  id: string
  text: string
  type?: 'system' | 'buy' | 'rent' | 'move' | 'jail' | 'card' | 'turn'
  timestamp: number
}

interface Props {
  events: GameEvent[]
  playerNameColors?: Record<string, string>
}

function inferType(text: string): string {
  const t = text.toLowerCase()
  if (text.startsWith('---')) return 'turn'
  if (t.includes('rolled') || t.includes('passed go')) return 'move'
  if (t.includes('bought') || t.includes('won the auction')) return 'buy'
  if (t.includes('rent') || t.includes('paid') || t.includes('pay $')) return 'rent'
  if (t.includes('jail') || t.includes('locked')) return 'jail'
  return 'system'
}

const TYPE_COLOR: Record<string, string> = {
  system: 'var(--cream-dim)',
  move:   'var(--gold)',
  buy:    '#22C55E',
  rent:   '#EF4444',
  jail:   '#EC4899',
  card:   '#3B82F6',
  turn:   'transparent',
}

const TYPE_EMOJI: Record<string, string> = {
  system: 'ℹ️',
  move:   '🎲',
  buy:    '🏠',
  rent:   '💸',
  jail:   '👮',
  card:   '✉️',
}

function colorizeText(text: string, nameColors: Record<string, string>): React.ReactNode {
  const names = Object.keys(nameColors).sort((a, b) => b.length - a.length)
  if (names.length === 0) return text

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, i) => {
        const color = nameColors[part]
        return color
          ? <strong key={i} style={{ color, fontWeight: 700 }}>{part}</strong>
          : <span key={i}>{part}</span>
      })}
    </>
  )
}

export default function EventLog({ events, playerNameColors = {} }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<string>('all')
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [events.length, autoScroll])

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    const type = event.type && event.type !== 'system' ? event.type : inferType(event.text)
    return type === filter
  })

  // Detect manual scrolling up to toggle auto-scroll
  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30
    setAutoScroll(isAtBottom)
  }

  const FILTERS = [
    { id: 'all', label: '📋 All' },
    { id: 'move', label: '🎲 Moves' },
    { id: 'buy', label: '🏠 Buys' },
    { id: 'rent', label: '💸 Rent' },
    { id: 'jail', label: '👮 Jail' },
  ]

  return (
    <div style={{
      background: 'var(--felt-card)',
      border: '2px solid var(--felt-border)',
      borderRadius: 14,
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.65rem 1rem 0.5rem 1rem',
        borderBottom: '1px solid var(--felt-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '0.82rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--cream-dim)',
          }}>
            Event Log
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button 
              onClick={() => setAutoScroll(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.65rem',
                color: autoScroll ? 'var(--gold)' : 'var(--cream-dim)',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 4px',
                borderRadius: 4,
              }}
              title="Toggle Auto-Scroll to Bottom"
            >
              {autoScroll ? '⬇️ Auto-Scroll' : '🔇 Locked'}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', color: '#22C55E', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <span className="live-dot" />
              Live
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="filter-scroll-container" style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '2px',
          margin: '0 -4px',
        }}>
          {FILTERS.map(f => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  background: active ? 'var(--gold)' : 'var(--felt-raised)',
                  border: `1.2px solid ${active ? 'var(--gold-dim)' : 'var(--felt-border)'}`,
                  color: active ? '#FFF' : 'var(--cream-dim)',
                  fontSize: '0.68rem',
                  fontWeight: active ? 700 : 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 100,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 120ms var(--ease-out)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div 
        ref={listRef}
        onScroll={handleScroll}
        style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 160,
          maxHeight: 520,
          padding: '0.4rem 0',
          position: 'relative',
        }}
      >
        {filteredEvents.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', textAlign: 'center', padding: '2rem 1rem', opacity: 0.5 }}>
            No matching events found.
          </p>
        )}

        {filteredEvents.map(event => {
          const type = event.type && event.type !== 'system' ? event.type : inferType(event.text)
          const isTurn = type === 'turn'
          const cleanText = isTurn
            ? event.text.replace(/^-+\s*/, '').replace(/\s*-+$/, '')
            : event.text

          if (isTurn) {
            return (
              <div key={event.id} className="log-entry" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.875rem',
                margin: '0.2rem 0',
                background: 'var(--felt-raised)',
                borderTop: '1px solid var(--felt-border)',
                borderBottom: '1px solid var(--felt-border)',
              }}>
                <span style={{ fontSize: '0.78rem' }}>⏳</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 700,
                  color: 'var(--cream)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {colorizeText(cleanText, playerNameColors)}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--felt-border)', opacity: 0.5 }} />
              </div>
            )
          }

          return (
            <div key={event.id} className="log-entry" style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              padding: '0.35rem 0.875rem',
              borderBottom: '1px solid var(--cream-faint)',
            }}>
              {/* Type emoji icon */}
              <span style={{
                fontSize: '0.82rem',
                flexShrink: 0,
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: `${TYPE_COLOR[type] ?? 'var(--cream-dim)'}12`,
              }}>
                {TYPE_EMOJI[type] ?? 'ℹ️'}
              </span>
              {/* Text */}
              <span style={{
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--cream)',
                fontFamily: 'Crimson Pro, serif',
                wordBreak: 'break-word',
              }}>
                {colorizeText(cleanText, playerNameColors)}
              </span>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22C55E;
          animation: pulse-dot 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }
        .log-entry {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out), background 120ms ease;
        }
        @starting-style {
          .log-entry {
            opacity: 0;
            transform: translateX(-8px);
          }
        }
        .filter-scroll-container::-webkit-scrollbar {
          height: 2px;
        }
        .filter-scroll-container::-webkit-scrollbar-thumb {
          background: var(--felt-border);
          border-radius: 1px;
        }
        @media (hover: hover) and (pointer: fine) {
          .log-entry:hover {
            background: var(--cream-faint) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .live-dot { animation: none; }
          .log-entry { transition: none; }
        }
      `}</style>
    </div>
  )
}
