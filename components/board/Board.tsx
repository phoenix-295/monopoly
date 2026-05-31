'use client'

import { BOARD, SQUARE_POSITIONS, BoardSquare, Side } from '@/lib/board-data'
import { useState, useEffect } from 'react'

interface TokenInfo {
  playerId: string
  color: string
  emoji: string
}

interface Props {
  tokenPositions: Record<string, number>
  playerColors: Record<string, string>
  playerEmojis: Record<string, string>
  onSquareClick: (squareIndex: number) => void
  highlightSquare?: number
  highlightColor?: string
  propertyOwners?: Record<number, string>
  propertyBuildings?: Record<number, { houses: number; hotel: boolean }>
}



function CornerSquare({ square, highlighted, highlightColor }: { square: BoardSquare; highlighted?: boolean; highlightColor?: string }) {
  const isGo = square.type === 'go'
  const isJail = square.type === 'jail'
  const isParking = square.type === 'free-parking'
  const isGoToJail = square.type === 'go-to-jail'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: highlighted ? `${highlightColor}18` : 'var(--felt-raised)',
        border: '1px solid var(--felt-border)',
        boxShadow: highlighted ? `inset 0 0 12px ${highlightColor}55` : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: '0.15rem',
        overflow: 'hidden',
        transition: 'box-shadow 300ms var(--ease-out), background 300ms var(--ease-out)',
      }}
    >
      {isGo && (
        <>
          <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', fontWeight: 900, fontFamily: 'Playfair Display, serif', color: '#E8192C', lineHeight: 1 }}>GO</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1.1vw, 0.7rem)', color: 'var(--cream-dim)', lineHeight: 1, textAlign: 'center' }}>Collect $200</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', lineHeight: 1 }}>→</div>
        </>
      )}
      {isJail && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: 1 }}>🔒</div>
          <div style={{ fontSize: 'clamp(0.42rem, 0.95vw, 0.62rem)', color: '#EC4899', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2, textAlign: 'center' }}>Just Visiting</div>
          <div style={{ fontSize: 'clamp(0.38rem, 0.85vw, 0.56rem)', color: 'var(--cream-dim)', lineHeight: 1 }}>/ Jail</div>
        </>
      )}
      {isParking && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: 1 }}>🅿️</div>
          <div style={{ fontSize: 'clamp(0.42rem, 0.95vw, 0.62rem)', color: '#EAB308', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, textAlign: 'center' }}>Free<br />Parking</div>
        </>
      )}
      {isGoToJail && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: 1 }}>👮</div>
          <div style={{ fontSize: 'clamp(0.42rem, 0.95vw, 0.62rem)', color: '#E8192C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, textAlign: 'center' }}>Go To<br />Jail!</div>
        </>
      )}

    </div>
  )
}

function RegularSquare({
  square,
  rotation,
  onClick,
  highlighted,
  highlightColor,
  ownedColor,
  buildings,
}: {
  square: BoardSquare
  side: Side
  rotation: number
  onClick: () => void
  highlighted?: boolean
  highlightColor?: string
  ownedColor?: string
  buildings?: { houses: number; hotel: boolean }
}) {
  const isProperty = square.type === 'property'
  const isRailroad = square.type === 'railroad'
  const isUtility = square.type === 'utility'
  const isChance = square.type === 'chance'
  const isCommunity = square.type === 'community-chest'
  const isTax = square.type === 'income-tax' || square.type === 'luxury-tax'
  const isClickable = isProperty || isRailroad || isUtility || isTax

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={isClickable ? 'square-clickable' : undefined}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--felt-border)',
        background: highlighted ? `${highlightColor}18` : 'var(--felt-card)',
        boxShadow: [
          ownedColor ? `inset 0 0 0 3.5px ${ownedColor}, 0 0 6px ${ownedColor}20` : '',
          highlighted ? `inset 0 0 12px ${highlightColor}55` : '',
        ].filter(Boolean).join(', ') || undefined,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 300ms var(--ease-out), background 300ms var(--ease-out)',
      }}
    >
      {/* Rotated inner content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${rotation}deg)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Color strip */}
        {isProperty && square.color && (
          <div
            style={{
              width: '100%',
              height: '28%',
              background: square.color,
              flexShrink: 0,
              borderBottom: '1px solid rgba(0,0,0,0.12)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '0 2px',
            }}
          >
            {buildings?.hotel ? (
              <div
                title="Hotel"
                style={{
                  width: 9,
                  height: 9,
                  background: '#E8192C',
                  border: '1px solid rgba(0,0,0,0.3)',
                  borderRadius: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            ) : (
              buildings?.houses && buildings.houses > 0 ? (
                Array.from({ length: buildings.houses }).map((_, idx) => (
                  <div
                    key={idx}
                    title={`${buildings.houses} Houses`}
                    style={{
                      width: 5,
                      height: 5,
                      background: '#22C55E',
                      border: '1px solid rgba(0,0,0,0.3)',
                      borderRadius: 1,
                      boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
                    }}
                  />
                ))
              ) : null
            )}
          </div>
        )}

        {/* Icon strip */}
        {!isProperty && (
          <div
            style={{
              height: '28%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(0.6rem, 1.5vw, 1rem)',
              flexShrink: 0,
              width: '100%',
            }}
          >
            {isChance && (
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#FF6B35', fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', lineHeight: 1 }}>?</div>
            )}
            {isCommunity && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>📦</span>}
            {isRailroad && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>🚂</span>}
            {isUtility && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>{square.icon}</span>}
            {isTax && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>{square.icon}</span>}
          </div>
        )}

        {/* Name */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 2px' }}>
          <span
            style={{
              fontSize: 'clamp(0.32rem, 0.85vw, 0.56rem)',
              fontFamily: 'Crimson Pro, serif',
              fontWeight: 600,
              color: 'var(--cream)',
              textAlign: 'center',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            {square.name}
          </span>
        </div>

        {/* Price */}
        {square.price && (
          <div style={{ fontSize: 'clamp(0.3rem, 0.75vw, 0.5rem)', color: 'var(--cream-dim)', fontWeight: 700, fontFamily: 'monospace', paddingBottom: '2px', flexShrink: 0 }}>
            ${square.price}
          </div>
        )}
        {square.taxAmount && (
          <div style={{ fontSize: 'clamp(0.3rem, 0.75vw, 0.5rem)', color: '#EF4444', fontWeight: 700, fontFamily: 'monospace', paddingBottom: '2px', flexShrink: 0 }}>
            ${square.taxAmount}
          </div>
        )}
      </div>

    </div>
  )
}

export default function Board({
  tokenPositions,
  playerColors,
  playerEmojis,
  onSquareClick,
  highlightSquare,
  highlightColor,
  propertyOwners,
  propertyBuildings,
}: Props) {
  const SQ = 54
  const CORNER = SQ * 2
  const BOARD_SIZE = SQ * 9 + CORNER * 2

  const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>(tokenPositions)

  // Immediately synchronize keys when tokenPositions changes (initial load, player joins/leaves)
  useEffect(() => {
    const next = { ...animatedPositions }
    let changed = false

    // Add missing players
    for (const [playerId, pos] of Object.entries(tokenPositions)) {
      if (next[playerId] === undefined) {
        next[playerId] = pos
        changed = true
      }
    }
    // Remove disconnected/inactive players
    for (const playerId of Object.keys(next)) {
      if (tokenPositions[playerId] === undefined) {
        delete next[playerId]
        changed = true
      }
    }

    if (changed) {
      setAnimatedPositions(next)
    }
  }, [tokenPositions, animatedPositions])

  // Step-by-step sequential walking animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      let needsUpdate = false
      const nextPositions = { ...animatedPositions }

      for (const [playerId, targetPos] of Object.entries(tokenPositions)) {
        const currentPos = animatedPositions[playerId] ?? targetPos
        if (currentPos !== targetPos) {
          const distance = (targetPos - currentPos + 40) % 40
          if (distance > 12) {
            // It's a teleport (Jail, Card jump, etc.) -> Jump directly
            nextPositions[playerId] = targetPos
          } else {
            // Normal dice movement -> Walk 1 step forward
            nextPositions[playerId] = (currentPos + 1) % 40
          }
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        setAnimatedPositions(nextPositions)
      } else {
        clearInterval(interval)
      }
    }, 300) // 300ms per square step - smooth and easy on the eyes!

    return () => clearInterval(interval)
  }, [tokenPositions, animatedPositions])

  // Center coordinate of any square index
  function getSquareCenter(index: number) {
    const pos = SQUARE_POSITIONS[index]
    if (!pos) return { x: 351, y: 351 }
    let x = 0
    let y = 0
    if (pos.col === 1) {
      x = CORNER / 2
    } else if (pos.col === 11) {
      x = CORNER + 9 * SQ + CORNER / 2
    } else {
      x = CORNER + (pos.col - 2) * SQ + SQ / 2
    }
    if (pos.row === 1) {
      y = CORNER / 2
    } else if (pos.row === 11) {
      y = CORNER + 9 * SQ + CORNER / 2
    } else {
      y = CORNER + (pos.row - 2) * SQ + SQ / 2
    }
    return { x, y }
  }

  // Multi-token layout offset inside a square
  function getTokenOffset(playerIndex: number, totalTokens: number) {
    if (totalTokens <= 1) return { dx: 0, dy: 0 }
    const offsets = [
      { dx: -10, dy: -10 },
      { dx: 10, dy: -10 },
      { dx: -10, dy: 10 },
      { dx: 10, dy: 10 },
      { dx: 0, dy: -15 },
      { dx: 0, dy: 15 },
      { dx: -15, dy: 0 },
      { dx: 15, dy: 0 }
    ]
    return offsets[playerIndex % offsets.length]
  }

  // Get position and arrow symbol pointing from outside the border
  function getOuterArrowStyle(index: number, playerIndex: number, totalOnSquare: number) {
    const pos = SQUARE_POSITIONS[index]
    if (!pos) return null
    const center = getSquareCenter(index)
    const spreadOffset = totalOnSquare <= 1 ? 0 : (playerIndex - (totalOnSquare - 1) / 2) * 12
    const GAP = 12
    let left = 0
    let top = 0
    let symbol = '▲'
    if (pos.side === 'bottom' || (pos.side === 'corner' && (index === 0 || index === 10))) {
      left = center.x + spreadOffset
      top = BOARD_SIZE + GAP
      symbol = '▲'
    } else if (pos.side === 'top' || (pos.side === 'corner' && (index === 20 || index === 30))) {
      left = center.x + spreadOffset
      top = -GAP
      symbol = '▼'
    } else if (pos.side === 'left') {
      left = -GAP
      top = center.y + spreadOffset
      symbol = '▶'
    } else if (pos.side === 'right') {
      left = BOARD_SIZE + GAP
      top = center.y + spreadOffset
      symbol = '◀'
    }
    return { left, top, symbol }
  }

  // Pre-calculate token groups on each square to offset duplicates using animated positions
  const squareTokens: Record<number, string[]> = {}
  Object.entries(animatedPositions).forEach(([playerId, pos]) => {
    if (!squareTokens[pos]) squareTokens[pos] = []
    squareTokens[pos].push(playerId)
  })

  const tokenMap: Record<number, TokenInfo[]> = {}
  for (const [playerId, pos] of Object.entries(tokenPositions)) {
    if (!tokenMap[pos]) tokenMap[pos] = []
    tokenMap[pos].push({
      playerId,
      color: playerColors[playerId] ?? '#FF6B35',
      emoji: playerEmojis[playerId] ?? '🎲',
    })
  }

  return (
    <div
      style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        display: 'grid',
        gridTemplateColumns: `${CORNER}px repeat(9, ${SQ}px) ${CORNER}px`,
        gridTemplateRows: `${CORNER}px repeat(9, ${SQ}px) ${CORNER}px`,
        border: '3px solid var(--felt-border)',
        borderRadius: 10,
        overflow: 'visible',
        boxShadow: 'var(--shadow-deep)',
        background: 'var(--felt-raised)',
        flexShrink: 0,
        position: 'relative', // essential for overlay positioning
      }}
    >
      {/* Board center */}
      <div
        style={{
          gridColumn: '2 / 11',
          gridRow: '2 / 11',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          background: 'var(--felt-raised)',
          borderLeft: '1px solid var(--felt-border)',
          borderRight: '1px solid var(--felt-border)',
          borderTop: '1px solid var(--felt-border)',
          borderBottom: '1px solid var(--felt-border)',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.2rem, 3vw, 2.2rem)',
            fontWeight: 900,
            color: '#E8192C',
            letterSpacing: '0.08em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          MONOPOLY
        </div>

        {/* Rainbow property group dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[
            '#92400E', '#38BDF8', '#EC4899', '#F97316',
            '#E8192C', '#EAB308', '#22C55E', '#3B82F6',
          ].map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c,
                boxShadow: `0 1px 3px ${c}88`,
              }}
            />
          ))}
        </div>

        <div className="gold-rule" style={{ width: 180, margin: 0 }} />

        <div
          style={{
            fontSize: '0.6rem',
            color: 'var(--cream-dim)',
            fontFamily: 'Crimson Pro, serif',
            textAlign: 'center',
            lineHeight: 1.5,
            opacity: 0.75,
          }}
        >
          Click any property<br />to view its deed card.
        </div>
      </div>

      {/* All 40 squares */}
      {BOARD.map(square => {
        const pos = SQUARE_POSITIONS[square.index]
        const highlighted = square.index === highlightSquare

        return (
          <div
            key={square.index}
            style={{ gridColumn: pos.col, gridRow: pos.row }}
          >
            {pos.side === 'corner' ? (
              <CornerSquare
                square={square}
                highlighted={highlighted}
                highlightColor={highlightColor}
              />
            ) : (
              <RegularSquare
                square={square}
                side={pos.side}
                rotation={pos.rotation}
                onClick={() => onSquareClick(square.index)}
                highlighted={highlighted}
                highlightColor={highlightColor}
                ownedColor={propertyOwners?.[square.index]}
                buildings={propertyBuildings?.[square.index]}
              />
            )}
          </div>
        )
      })}

      {/* Floating Animated Tokens Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {Object.entries(animatedPositions).map(([playerId, pos]) => {
          const center = getSquareCenter(pos)
          const playersOnSameSquare = squareTokens[pos] ?? []
          const tokenIndex = playersOnSameSquare.indexOf(playerId)
          const offset = getTokenOffset(tokenIndex, playersOnSameSquare.length)
          const color = playerColors[playerId] ?? '#FF6B35'
          const emoji = playerEmojis[playerId] ?? '🎲'

          return (
            <div
              key={playerId}
              style={{
                position: 'absolute',
                left: center.x + offset.dx,
                top: center.y + offset.dy,
                transform: 'translate(-50%, -50%)',
                transition: 'left 280ms cubic-bezier(0.4, 0, 0.2, 1), top 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Pulsing Color Halo Ring */}
              <div 
                className="token-pulsing-halo"
                style={{
                  position: 'absolute',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: `${color}18`,
                  animation: 'halo-pulse 2s infinite ease-in-out',
                  pointerEvents: 'none',
                }}
              />
              <div
                className="token-dot"
                style={{
                  background: color,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  animation: 'token-pop 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                }}
                title={playerId}
              >
                <span style={{ fontSize: '0.6rem', transform: 'scale(1.2)' }}>{emoji}</span>
              </div>
            </div>
          )
        })}
      {/* Floating Outer Border Arrows Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9,
          overflow: 'visible',
        }}
      >
        {Object.entries(tokenPositions).map(([playerId, pos]) => {
          const playersOnSameSquare = squareTokens[pos] ?? []
          const tokenIndex = playersOnSameSquare.indexOf(playerId)
          const arrow = getOuterArrowStyle(pos, tokenIndex, playersOnSameSquare.length)
          if (!arrow) return null
          
          const color = playerColors[playerId] ?? '#FF6B35'
          
          return (
            <div
              key={`arrow-${playerId}`}
              style={{
                position: 'absolute',
                left: arrow.left,
                top: arrow.top,
                transform: 'translate(-50%, -50%)',
                color: color,
                fontSize: '0.9rem',
                fontWeight: 900,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transition: 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), top 500ms cubic-bezier(0.25, 1, 0.5, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'arrow-pulse-glow 1.5s infinite ease-in-out',
              }}
            >
              {arrow.symbol}
            </div>
          )
        })}
      </div>
      </div>

      <style>{`
        @keyframes token-pop {
          from { transform: scale(0.6); opacity: 0.5; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes halo-pulse {
          0%   { transform: scale(0.85); opacity: 0.45; }
          50%  { transform: scale(1.15); opacity: 0.75; }
          100% { transform: scale(0.85); opacity: 0.45; }
        }
        @keyframes arrow-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 1px currentColor); opacity: 0.7; }
          50%      { filter: drop-shadow(0 0 6px currentColor); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
