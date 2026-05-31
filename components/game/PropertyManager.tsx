'use client'

import { useState } from 'react'
import type { GameState, OwnedProperty } from '@/lib/game-engine'
import { BOARD } from '@/lib/board-data'
import { canBuild, ownsFullGroup } from '@/lib/game-engine'

interface Props {
  game: GameState
  myUserId: string
  isMyTurn: boolean
  acting: boolean
  onBuild: (squareIndex: number, count: number) => void
  onSell: (squareIndex: number, count: number) => void
  onMortgage: (squareIndex: number) => void
  onUnmortgage: (squareIndex: number) => void
  onBankrupt: () => void
  onSquareClick?: (squareIndex: number) => void
}

const GROUP_COLORS: Record<string, string> = {
  brown: '#92400E', 'light-blue': '#0EA5E9', pink: '#EC4899',
  orange: '#F97316', red: '#E8192C', yellow: '#EAB308',
  green: '#22C55E', 'dark-blue': '#3B82F6',
}

export default function PropertyManager({
  game, myUserId, isMyTurn, acting, onBuild, onSell, onMortgage, onUnmortgage, onBankrupt, onSquareClick,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const myProps = game.properties
    .filter(p => p.ownerId === myUserId)
    .sort((a, b) => a.squareIndex - b.squareIndex)
  const myPlayer = game.players.find(p => p.id === myUserId)

  if (myProps.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--felt-card)',
        border: '2px solid var(--felt-border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--cream)',
        }}
      >
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          My Properties ({myProps.length})
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--cream-dim)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 300, overflowY: 'auto' }}>
          {myProps.map(prop => {
            const square = BOARD[prop.squareIndex]
            const color = square.type === 'property' && square.colorGroup ? GROUP_COLORS[square.colorGroup] : '#888'
            const canBuildHere = isMyTurn && !prop.mortgaged && square.type === 'property' && canBuild(game, myUserId, prop.squareIndex) === null
            const canSellHere = isMyTurn && (prop.houses > 0 || prop.hotel)
            const canMortgage = isMyTurn && !prop.mortgaged && prop.houses === 0 && !prop.hotel
            const canUnmortgage = isMyTurn && prop.mortgaged && (myPlayer?.cash ?? 0) >= Math.floor(('price' in square ? (square as { price: number }).price : 0) * 0.55)

            const houseDisplay = prop.hotel ? '🏨' : prop.houses > 0 ? '🏠'.repeat(prop.houses) : ''

            return (
              <div
                key={prop.squareIndex}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: 8,
                  border: '1.5px solid var(--felt-border)',
                  background: prop.mortgaged ? 'rgba(0,0,0,0.03)' : 'transparent',
                  opacity: prop.mortgaged ? 0.65 : 1,
                }}
              >
                <div 
                  onClick={() => onSquareClick?.(prop.squareIndex)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    marginBottom: '0.25rem',
                    cursor: 'pointer',
                  }}
                  className="property-row-header"
                  title="Click to view rent details card"
                >
                  {square.type === 'property' && (
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  )}
                  <span 
                    className="property-clickable-name"
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      color: 'var(--cream)', 
                      flex: 1,
                      transition: 'color 150ms ease',
                    }}
                  >
                    {square.name} <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>📇</span>
                  </span>
                  {houseDisplay && <span style={{ fontSize: '0.65rem' }}>{houseDisplay}</span>}
                  {prop.mortgaged && <span style={{ fontSize: '0.6rem', color: '#f87171' }}>MORTGAGED</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {canBuildHere && (
                    <button
                      className="btn-gold"
                      disabled={acting}
                      onClick={() => onBuild(prop.squareIndex, 1)}
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem', borderRadius: 6 }}
                    >
                      +🏠
                    </button>
                  )}
                  {canSellHere && (
                    <button
                      className="btn-ghost"
                      disabled={acting}
                      onClick={() => onSell(prop.squareIndex, 1)}
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem', borderRadius: 6 }}
                    >
                      -🏠
                    </button>
                  )}
                  {canMortgage && (
                    <button
                      className="btn-ghost"
                      disabled={acting}
                      onClick={() => onMortgage(prop.squareIndex)}
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem', borderRadius: 6 }}
                    >
                      Mortgage
                    </button>
                  )}
                  {canUnmortgage && (
                    <button
                      className="btn-ghost"
                      disabled={acting}
                      onClick={() => onUnmortgage(prop.squareIndex)}
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem', borderRadius: 6 }}
                    >
                      Unmortgage
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {isMyTurn && myPlayer && myPlayer.cash < 0 && (
            <button
              className="btn-ghost"
              disabled={acting}
              onClick={onBankrupt}
              style={{ padding: '0.35rem', fontSize: '0.75rem', borderRadius: 8, color: '#f87171', borderColor: '#f87171', marginTop: '0.25rem' }}
            >
              Declare Bankruptcy
            </button>
          )}
        </div>
      )}

      <style>{`
        .property-row-header:hover .property-clickable-name {
          color: var(--gold) !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
