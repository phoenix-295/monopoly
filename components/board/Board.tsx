'use client'

import { BOARD, SQUARE_POSITIONS, BoardSquare, Side } from '@/lib/board-data'

const PLAYER_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#F97316',
  '#EC4899', '#8B5CF6', '#EAB308', '#06B6D4',
]

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
}

function CornerSquare({ square, tokens }: { square: BoardSquare; tokens: TokenInfo[] }) {
  const isGo = square.type === 'go'
  const isJail = square.type === 'jail'
  const isParking = square.type === 'free-parking'
  const isGoToJail = square.type === 'go-to-jail'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--felt-raised)',
        border: '1px solid var(--felt-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: '0.1rem',
        overflow: 'hidden',
      }}
    >
      {isGo && (
        <>
          <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', fontWeight: 900, fontFamily: 'Playfair Display, serif', color: '#E8192C', lineHeight: 1 }}>GO</div>
          <div style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.75rem)', color: 'var(--cream-dim)', lineHeight: 1, textAlign: 'center' }}>Collect $200</div>
          <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.8rem)' }}>→</div>
        </>
      )}
      {isJail && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>🔒</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: '#EC4899', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>Just Visiting</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: 'var(--cream-dim)', lineHeight: 1 }}>/ Jail</div>
        </>
      )}
      {isParking && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>🅿️</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: '#EAB308', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, textAlign: 'center' }}>Free</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: '#EAB308', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, textAlign: 'center' }}>Parking</div>
        </>
      )}
      {isGoToJail && (
        <>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>👮</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: '#E8192C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, textAlign: 'center' }}>Go To</div>
          <div style={{ fontSize: 'clamp(0.45rem, 1vw, 0.65rem)', color: '#E8192C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, textAlign: 'center' }}>Jail!</div>
        </>
      )}
      {/* Tokens */}
      {tokens.length > 0 && (
        <div style={{ position: 'absolute', bottom: 3, right: 3, display: 'flex', flexWrap: 'wrap', gap: 2, maxWidth: '60%' }}>
          {tokens.map(t => (
            <div
              key={t.playerId}
              title={t.playerId}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: t.color,
                border: '1px solid rgba(255,255,255,0.6)',
                fontSize: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RegularSquare({
  square,
  side,
  rotation,
  tokens,
  onClick,
}: {
  square: BoardSquare
  side: Side
  rotation: number
  tokens: TokenInfo[]
  onClick: () => void
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
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        border: '1px solid var(--felt-border)',
        background: 'var(--felt-card)',
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
        {/* Color strip for property */}
        {isProperty && square.color && (
          <div
            style={{
              width: '100%',
              height: '28%',
              background: square.color,
              flexShrink: 0,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          />
        )}

        {/* Icon for non-property */}
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
              <div style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 900,
                color: '#FF6B35',
                fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                lineHeight: 1,
              }}>?</div>
            )}
            {isCommunity && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>📦</span>}
            {isRailroad && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>🚂</span>}
            {isUtility && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>{square.icon}</span>}
            {isTax && <span style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)' }}>{square.icon}</span>}
          </div>
        )}

        {/* Name */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0 2px',
          }}
        >
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
          <div
            style={{
              fontSize: 'clamp(0.3rem, 0.75vw, 0.5rem)',
              color: 'var(--cream-dim)',
              fontWeight: 700,
              fontFamily: 'monospace',
              paddingBottom: '2px',
              flexShrink: 0,
            }}
          >
            ${square.price}
          </div>
        )}
        {square.taxAmount && (
          <div style={{ fontSize: 'clamp(0.3rem, 0.75vw, 0.5rem)', color: '#EF4444', fontWeight: 700, fontFamily: 'monospace', paddingBottom: '2px', flexShrink: 0 }}>
            ${square.taxAmount}
          </div>
        )}
      </div>

      {/* Tokens overlay — not rotated so they always appear correctly */}
      {tokens.length > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'center',
            justifyContent: 'center',
            gap: 2,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {tokens.map(t => (
            <div
              key={t.playerId}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: t.color,
                border: '1.5px solid rgba(255,255,255,0.8)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Hover overlay for clickable squares */}
      {isClickable && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,107,53,0)',
            transition: 'background 150ms ease',
            zIndex: 3,
          }}
          className="square-hover-overlay"
        />
      )}
    </div>
  )
}

export default function Board({ tokenPositions, playerColors, playerEmojis, onSquareClick }: Props) {
  const SQ = 54
  const CORNER = SQ * 2
  const BOARD_SIZE = SQ * 9 + CORNER * 2

  // Build token map: squareIndex → TokenInfo[]
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
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-deep)',
        background: 'var(--felt-raised)',
        flexShrink: 0,
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
          gap: '0.5rem',
          background: '#F0F8E8',
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
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          MONOPOLY
        </div>
        <div className="gold-rule" style={{ width: 200, margin: '0.25rem 0' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['🟫', '🩵', '🩷', '🟧', '🟥', '🟨', '🟩', '🟦'].map((c, i) => (
            <span key={i} style={{ fontSize: '1.2rem' }}>{c}</span>
          ))}
        </div>
        <div
          style={{
            fontSize: '0.65rem',
            color: '#555',
            fontFamily: 'Crimson Pro, serif',
            textAlign: 'center',
            marginTop: '0.5rem',
            lineHeight: 1.4,
          }}
        >
          Click any property to view its deed card.
          <br />
          Tokens move when you roll the dice.
        </div>
      </div>

      {/* All 40 squares */}
      {BOARD.map(square => {
        const pos = SQUARE_POSITIONS[square.index]
        const tokens = tokenMap[square.index] ?? []

        return (
          <div
            key={square.index}
            style={{
              gridColumn: pos.col,
              gridRow: pos.row,
            }}
          >
            {pos.side === 'corner' ? (
              <CornerSquare square={square} tokens={tokens} />
            ) : (
              <RegularSquare
                square={square}
                side={pos.side}
                rotation={pos.rotation}
                tokens={tokens}
                onClick={() => onSquareClick(square.index)}
              />
            )}
          </div>
        )
      })}

      <style>{`
        .square-hover-overlay:hover {
          background: rgba(255, 107, 53, 0.08) !important;
        }
      `}</style>
    </div>
  )
}
