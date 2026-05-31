'use client'

import { useState } from 'react'
import type { GameState, TradeOffer, OwnedProperty } from '@/lib/game-engine'
import { BOARD } from '@/lib/board-data'

interface Props {
  game: GameState
  myUserId: string
  partnerId: string
  onClose: () => void
  onPropose: (offer: TradeOffer) => void
}

const GROUP_COLORS: Record<string, string> = {
  brown: '#92400E', 'light-blue': '#0EA5E9', pink: '#EC4899',
  orange: '#F97316', red: '#E8192C', yellow: '#EAB308',
  green: '#22C55E', 'dark-blue': '#3B82F6',
}

export default function TradeModal({ game, myUserId, partnerId, onClose, onPropose }: Props) {
  const me = game.players.find(p => p.id === myUserId)!
  const partner = game.players.find(p => p.id === partnerId)!

  // State for what "I offer" (my side)
  const [myCash, setMyCash] = useState(0)
  const [myProps, setMyProps] = useState<number[]>([])
  const [myJailCards, setMyJailCards] = useState(0)

  // State for what "I request" (partner side)
  const [theirCash, setTheirCash] = useState(0)
  const [theirProps, setTheirProps] = useState<number[]>([])
  const [theirJailCards, setTheirJailCards] = useState(0)

  // Filter buildable properties owned by me with NO houses or hotels
  const myTradableProps = game.properties.filter(
    p => p.ownerId === myUserId && p.houses === 0 && !p.hotel
  )

  // Filter buildable properties owned by partner with NO houses or hotels
  const theirTradableProps = game.properties.filter(
    p => p.ownerId === partnerId && p.houses === 0 && !p.hotel
  )

  function toggleMyProp(index: number) {
    setMyProps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  function toggleTheirProp(index: number) {
    setTheirProps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  function handleSend() {
    const offerPayload: TradeOffer = {
      fromPlayerId: myUserId,
      toPlayerId: partnerId,
      offer: {
        cash: myCash,
        propertyIndices: myProps,
        getOutOfJailFree: myJailCards,
      },
      request: {
        cash: theirCash,
        propertyIndices: theirProps,
        getOutOfJailFree: theirJailCards,
      },
    }
    onPropose(offerPayload)
  }

  return (
    <div
      className="card-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="trade-modal-window"
        style={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--felt-card)',
          border: '2px solid var(--felt-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--felt-border)',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: 'var(--cream)',
              margin: 0,
            }}
          >
            🤝 Propose Trade to {partner.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cream-dim)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* LEFT: Your Offer */}
          <div
            style={{
              background: 'var(--felt-raised)',
              border: '1px solid var(--felt-border)',
              borderRadius: 12,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--gold)',
                margin: '0 0 0.2rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '0.35rem',
              }}
            >
              🎁 Your Offer (You Give)
            </h3>

            {/* Cash offer */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.25rem' }}>
                Cash Offer: <strong style={{ color: 'var(--cream)' }}>${myCash}</strong> (Max: ${me.cash})
              </label>
              <input
                type="range"
                min="0"
                max={me.cash}
                step="10"
                value={myCash}
                onChange={e => setMyCash(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </div>

            {/* Jail cards */}
            {me.getOutOfJailFree > 0 && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.25rem' }}>
                  Get Out Of Jail Cards:
                </label>
                <select
                  value={myJailCards}
                  onChange={e => setMyJailCards(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--felt-card)',
                    border: '1px solid var(--felt-border)',
                    borderRadius: 6,
                    padding: '0.25rem',
                    color: 'var(--cream)',
                    fontSize: '0.75rem',
                  }}
                >
                  {Array.from({ length: me.getOutOfJailFree + 1 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i} Cards
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Properties selection */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.35rem' }}>
                Select Properties to Offer:
              </label>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  paddingRight: '0.25rem',
                }}
              >
                {myTradableProps.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
                    No unbuilt properties owned.
                  </span>
                ) : (
                  myTradableProps.map(p => {
                    const square = BOARD[p.squareIndex]
                    const color = square.type === 'property' && square.colorGroup ? GROUP_COLORS[square.colorGroup] : '#666'
                    return (
                      <div
                        key={p.squareIndex}
                        onClick={() => toggleMyProp(p.squareIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: 6,
                          background: myProps.includes(p.squareIndex) ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.15)',
                          border: myProps.includes(p.squareIndex) ? '1px solid var(--gold)' : '1px solid var(--felt-border)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--cream)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {square.name} {p.mortgaged ? '(M)' : ''}
                        </span>
                        <input
                          type="checkbox"
                          checked={myProps.includes(p.squareIndex)}
                          onChange={() => {}} // handled by row click
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Their Offer (Your Request) */}
          <div
            style={{
              background: 'var(--felt-raised)',
              border: '1px solid var(--felt-border)',
              borderRadius: 12,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--gold)',
                margin: '0 0 0.2rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '0.35rem',
              }}
            >
              🔍 Your Request (You Get)
            </h3>

            {/* Cash request */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.25rem' }}>
                Cash Requested: <strong style={{ color: 'var(--cream)' }}>${theirCash}</strong> (Max: ${partner.cash})
              </label>
              <input
                type="range"
                min="0"
                max={partner.cash}
                step="10"
                value={theirCash}
                onChange={e => setTheirCash(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </div>

            {/* Jail cards */}
            {partner.getOutOfJailFree > 0 && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.25rem' }}>
                  Get Out Of Jail Cards:
                </label>
                <select
                  value={theirJailCards}
                  onChange={e => setTheirJailCards(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--felt-card)',
                    border: '1px solid var(--felt-border)',
                    borderRadius: 6,
                    padding: '0.25rem',
                    color: 'var(--cream)',
                    fontSize: '0.75rem',
                  }}
                >
                  {Array.from({ length: partner.getOutOfJailFree + 1 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i} Cards
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Properties selection */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.35rem' }}>
                Select Properties to Request:
              </label>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  paddingRight: '0.25rem',
                }}
              >
                {theirTradableProps.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
                    No unbuilt properties owned.
                  </span>
                ) : (
                  theirTradableProps.map(p => {
                    const square = BOARD[p.squareIndex]
                    const color = square.type === 'property' && square.colorGroup ? GROUP_COLORS[square.colorGroup] : '#666'
                    return (
                      <div
                        key={p.squareIndex}
                        onClick={() => toggleTheirProp(p.squareIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: 6,
                          background: theirProps.includes(p.squareIndex) ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.15)',
                          border: theirProps.includes(p.squareIndex) ? '1px solid var(--gold)' : '1px solid var(--felt-border)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--cream)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {square.name} {p.mortgaged ? '(M)' : ''}
                        </span>
                        <input
                          type="checkbox"
                          checked={theirProps.includes(p.squareIndex)}
                          onChange={() => {}} // handled by row click
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--felt-border)',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8rem',
              borderRadius: 8,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="btn-gold"
            disabled={myCash === 0 && myProps.length === 0 && myJailCards === 0 && theirCash === 0 && theirProps.length === 0 && theirJailCards === 0}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.8rem',
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Propose Trade
          </button>
        </div>
      </div>
    </div>
  )
}
