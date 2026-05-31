'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Board from '@/components/board/Board'
import PropertyCard from '@/components/board/PropertyCard'
import Dice from '@/components/board/Dice'
import PlayerPanel, { PanelPlayer } from '@/components/board/PlayerPanel'
import EventLog, { GameEvent } from '@/components/board/EventLog'
import { BOARD, BoardSquare } from '@/lib/board-data'

const PLAYER_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#F97316',
  '#EC4899', '#8B5CF6', '#EAB308', '#06B6D4',
]

const TOKEN_EMOJI: Record<string, string> = {
  top_hat: '🎩', car: '🚗', dog: '🐕', ship: '⛵', iron: '🪂', boot: '👞',
}

interface RawPlayer {
  id: string
  userId: string
  token: string | null
  turnOrder: number
  username: string
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [rawPlayers, setRawPlayers] = useState<RawPlayer[]>([])
  const [tokenPositions, setTokenPositions] = useState<Record<string, number>>({})
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1])
  const [selectedSquare, setSelectedSquare] = useState<BoardSquare | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([
    { id: '0', text: 'Game started! Good luck everyone.', type: 'system', timestamp: Date.now() },
  ])
  const [error, setError] = useState('')

  const loadGame = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setMyUserId(user.id)

    const { data: roomData } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('code', code)
      .single()

    if (!roomData) { setError('Room not found'); return }
    if (roomData.status !== 'active') { router.push(`/lobby/${code}`); return }

    const { data: playersData } = await supabase
      .from('room_players')
      .select('id, user_id, token, turn_order, profiles(username)')
      .eq('room_id', roomData.id)
      .order('turn_order')

    if (playersData) {
      const players: RawPlayer[] = playersData.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        userId: p.user_id as string,
        token: p.token as string | null,
        turnOrder: p.turn_order as number,
        username: Array.isArray(p.profiles)
          ? (p.profiles[0] as { username: string })?.username ?? 'Unknown'
          : (p.profiles as { username: string } | null)?.username ?? 'Unknown',
      }))
      setRawPlayers(players)

      // Initialize all players at square 0
      const positions: Record<string, number> = {}
      players.forEach(p => { positions[p.userId] = 0 })
      setTokenPositions(positions)

      // Auto-select current user's player
      const me = players.find(p => p.userId === user.id)
      if (me) setSelectedPlayerId(me.userId)
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadGame()
  }, [loadGame])

  function handleSquareClick(squareIndex: number) {
    const square = BOARD[squareIndex]

    // If a player is selected, move them to this square (Phase 3 demo: no logic)
    if (selectedPlayerId) {
      setTokenPositions(prev => ({ ...prev, [selectedPlayerId]: squareIndex }))
      const player = rawPlayers.find(p => p.userId === selectedPlayerId)
      const name = player?.username ?? 'Player'
      addEvent({ text: `${name} moved to ${square.name} (sq. ${squareIndex})`, type: 'move' })
    }

    // Open deed card for purchasable squares
    if (['property', 'railroad', 'utility', 'income-tax', 'luxury-tax'].includes(square.type)) {
      setSelectedSquare(square)
    }
  }

  function handleRoll(values: [number, number]) {
    setDiceValues(values)
    const total = values[0] + values[1]
    const doubles = values[0] === values[1]

    if (!selectedPlayerId) return

    const currentPos = tokenPositions[selectedPlayerId] ?? 0
    const newPos = (currentPos + total) % 40
    const passedGo = currentPos + total >= 40
    const square = BOARD[newPos]
    const player = rawPlayers.find(p => p.userId === selectedPlayerId)
    const name = player?.username ?? 'Player'

    setTokenPositions(prev => ({ ...prev, [selectedPlayerId]: newPos }))

    if (passedGo) addEvent({ text: `${name} passed GO! Collect $200.`, type: 'move' })
    addEvent({ text: `${name} rolled ${values[0]}+${values[1]}=${total}${doubles ? ' (doubles!)' : ''} → landed on ${square.name}`, type: 'move' })

    if (square.type === 'go-to-jail') {
      setTokenPositions(prev => ({ ...prev, [selectedPlayerId]: 10 }))
      addEvent({ text: `${name} went to Jail! 🔒`, type: 'jail' })
    }
  }

  function addEvent(e: Omit<GameEvent, 'id' | 'timestamp'>) {
    setEvents(prev => [...prev, { ...e, id: String(Date.now() + Math.random()), timestamp: Date.now() }])
  }

  // Build panel players
  const playerColors: Record<string, string> = {}
  const playerEmojis: Record<string, string> = {}
  const panelPlayers: PanelPlayer[] = rawPlayers.map((p, i) => {
    const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
    playerColors[p.userId] = color
    playerEmojis[p.userId] = p.token ? TOKEN_EMOJI[p.token] ?? '🎲' : '🎲'
    return {
      id: p.userId,
      username: p.username,
      token: p.token,
      cash: 1500, // Phase 3: static — real cash comes in Phase 4
      position: tokenPositions[p.userId] ?? 0,
      isCurrentTurn: false, // Phase 3: no turn logic yet
      color,
    }
  })

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="felt-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 360 }}>
          <p style={{ color: 'var(--cream-dim)', marginBottom: '1rem' }}>{error}</p>
          <button onClick={() => router.push('/lobby')} className="btn-gold" style={{ padding: '0.5rem 1.5rem' }}>
            Back to Lobby
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--gold)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            MONOPOLY
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', margin: 0 }}>Room: {code}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Dice values={diceValues} onRoll={handleRoll} disabled={!selectedPlayerId} />
          <button
            onClick={() => router.push('/lobby')}
            className="btn-ghost"
            style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          flex: 1,
        }}
      >
        {/* Player panel */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <PlayerPanel
            players={panelPlayers}
            myId={myUserId ?? ''}
            selectedId={selectedPlayerId ?? undefined}
            onSelectPlayer={id => {
              setSelectedPlayerId(id)
              addEvent({ text: `Controlling: ${panelPlayers.find(p => p.id === id)?.username}`, type: 'system' })
            }}
          />
        </div>

        {/* Board — scroll container for small screens */}
        <div
          style={{
            flex: '1 1 auto',
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          <Board
            tokenPositions={tokenPositions}
            playerColors={playerColors}
            playerEmojis={playerEmojis}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Event log */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <EventLog events={events} />
        </div>
      </div>

      {/* Property deed card modal */}
      <PropertyCard
        square={selectedSquare}
        onClose={() => setSelectedSquare(null)}
      />
    </main>
  )
}
