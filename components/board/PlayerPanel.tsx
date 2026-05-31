'use client'

export interface PanelPlayer {
  id: string
  username: string
  token: string | null
  cash: number
  position: number
  isCurrentTurn: boolean
  color: string
  isOnline?: boolean
}

interface Props {
  players: PanelPlayer[]
  myId: string
  onSelectPlayer?: (id: string) => void
  selectedId?: string
}

const TOKEN_EMOJI: Record<string, string> = {
  top_hat: '🎩', car: '🚗', dog: '🐕', ship: '⛵', iron: '🪂', boot: '👞',
}

export default function PlayerPanel({ players, myId, onSelectPlayer, selectedId }: Props) {
  return (
    <div
      style={{
        background: 'var(--felt-card)',
        border: '2px solid var(--felt-border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-card)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minWidth: 0,
      }}
    >
      <h2
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '0.9rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--cream-dim)',
          margin: 0,
        }}
      >
        Players
      </h2>

      {players.map(player => (
        <div
          key={player.id}
          onClick={() => onSelectPlayer?.(player.id)}
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: 10,
            border: `2px solid ${player.id === selectedId ? player.color : 'var(--felt-border)'}`,
            background: player.isCurrentTurn
              ? `${player.color}18`
              : player.id === myId
                ? 'rgba(255,107,53,0.05)'
                : 'transparent',
            cursor: onSelectPlayer ? 'pointer' : 'default',
            transition: 'border-color 150ms ease, background 150ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            {/* Token dot */}
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: player.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: player.color,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                flex: 1,
              }}
            >
              <span>{player.token ? TOKEN_EMOJI[player.token] ?? '🎲' : '🎲'} {player.username}</span>
              {player.id === myId && (
                <span style={{ fontSize: '0.7rem', color: 'var(--cream-dim)', marginLeft: 4 }}>(you)</span>
              )}
              {player.isOnline !== undefined && (
                <span 
                  title={player.isOnline ? 'Online' : 'Offline'}
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: player.isOnline ? '#22C55E' : '#6B7280',
                    boxShadow: player.isOnline ? '0 0 6px #22C55E, 0 0 2px #22C55E' : 'none',
                    marginLeft: '0.4rem',
                    transition: 'all 300ms ease',
                  }}
                />
              )}
            </span>
            {player.isCurrentTurn && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: `${player.color}22`,
                  border: `1.5px solid ${player.color}88`,
                  color: player.color,
                  borderRadius: 100,
                  padding: '0.05rem 0.4rem',
                  flexShrink: 0,
                  fontWeight: 700,
                }}
              >
                Turn
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>
              ${player.cash.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--cream-dim)' }}>
              Sq. {player.position}
            </span>
          </div>
        </div>
      ))}

      {players.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', textAlign: 'center', padding: '1rem 0' }}>
          No players
        </p>
      )}
    </div>
  )
}
