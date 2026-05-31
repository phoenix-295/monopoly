'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TOKENS } from '@/lib/tokens'

interface Player {
  id: string
  userId: string
  isReady: boolean
  token: string | null
  turnOrder: number
  profile: { username: string } | null
}

interface Room {
  id: string
  code: string
  hostId: string
  status: string
  maxPlayers: number
}

export default function LobbyRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const supabase = createClient()

  const loadRoom = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setMyUserId(user.id)

    const { data: roomData } = await supabase
      .from('rooms')
      .select('id, code, host_id, status, max_players')
      .eq('code', code)
      .single()

    if (!roomData) { setError('Room not found'); return }

    setRoom({
      id: roomData.id,
      code: roomData.code,
      hostId: roomData.host_id,
      status: roomData.status,
      maxPlayers: roomData.max_players,
    })

    if (roomData.status === 'active') {
      router.push(`/game/${code}`)
      return
    }

    await loadPlayers(roomData.id)
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPlayers(roomId: string) {
    const { data } = await supabase
      .from('room_players')
      .select('id, user_id, is_ready, token, turn_order, profiles(username)')
      .eq('room_id', roomId)
      .order('turn_order')

    if (data) {
      setPlayers(data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        userId: p.user_id as string,
        isReady: p.is_ready as boolean,
        token: p.token as string | null,
        turnOrder: p.turn_order as number,
        profile: Array.isArray(p.profiles) ? p.profiles[0] as { username: string } | null : p.profiles as { username: string } | null,
      })))
    }
  }

  useEffect(() => {
    loadRoom()
  }, [loadRoom])

  // Realtime subscription
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`lobby:${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${room.id}`,
      }, () => { loadPlayers(room.id) })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        const r = payload.new as Record<string, unknown>
        if (r.status === 'active') router.push(`/game/${code}`)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleReady() {
    setToggling(true)
    try {
      const res = await fetch('/api/rooms/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to toggle ready')
      }
    } finally {
      setToggling(false)
    }
  }

  async function kickPlayer(targetUserId: string) {
    const res = await fetch('/api/rooms/kick', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: code, targetUserId }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to kick player')
    }
  }

  async function startGame() {
    setStarting(true)
    setError('')
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to start game')
      }
    } finally {
      setStarting(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const me = players.find(p => p.userId === myUserId)
  const isHost = room?.hostId === myUserId
  const allReady = players.length >= 2 && players.every(p => p.isReady)
  const tokenMap = Object.fromEntries(TOKENS.map(t => [t.id, t.emoji]))

  if (error && !room) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="felt-card rounded p-8 text-center max-w-sm">
          <p className="text-[var(--cream-dim)] mb-4">{error}</p>
          <button onClick={() => router.push('/lobby')} className="btn-gold rounded py-2 px-6 text-sm">
            Back to Lobby
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed top-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-blue)' }}>♠</div>
      <div className="fixed top-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-red)' }}>♥</div>
      <div className="fixed bottom-6 left-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-green)' }}>♣</div>
      <div className="fixed bottom-6 right-6 text-2xl opacity-50 select-none" style={{ color: 'var(--prop-orange)' }}>♦</div>

      <div className="w-full max-w-xl animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-black italic mb-1"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--gold)' }}
          >
            Game Lobby
          </h1>
          <p className="text-sm" style={{ color: 'var(--cream-dim)' }}>
            {isHost ? 'You are the host' : 'Waiting for host to start'}
          </p>
          <div className="gold-rule mt-4" />
        </div>

        {/* Room code */}
        <div className="felt-card rounded p-5 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--cream-dim)', fontFamily: 'Playfair Display, serif' }}>
              Room Code
            </p>
            <p
              className="text-3xl font-mono font-bold tracking-[0.2em]"
              style={{ color: 'var(--gold)', fontFamily: 'monospace' }}
            >
              {code}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="btn-ghost rounded px-4 py-2 text-sm flex items-center gap-2"
          >
            {copied ? (
              <><span>✓</span> Copied</>
            ) : (
              <><span>📋</span> Copy</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 text-sm rounded"
            style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* Player list */}
        <div className="felt-card rounded p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'Playfair Display, serif', color: 'var(--cream)' }}
            >
              Players
            </h2>
            <span className="text-xs" style={{ color: 'var(--cream-dim)' }}>
              {players.length} / {room?.maxPlayers ?? 6}
            </span>
          </div>

          {players.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--cream-dim)', opacity: 0.5 }}>
              Loading players…
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{
                    background: player.userId === myUserId ? 'rgba(255,107,53,0.08)' : 'rgba(0,0,0,0.02)',
                    border: player.userId === myUserId ? '2px solid var(--felt-border-bright)' : '2px solid var(--felt-border)',
                    borderRadius: '10px',
                  }}
                >
                  {/* Token / order */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold-dim)' }}
                  >
                    {player.token ? tokenMap[player.token] ?? '🎲' : String(i + 1)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block" style={{ color: 'var(--cream)' }}>
                      {player.profile?.username ?? 'Unknown'}
                      {room?.hostId === player.userId && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--gold-dim)' }}>HOST</span>
                      )}
                      {player.userId === myUserId && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--cream-dim)' }}>(you)</span>
                      )}
                    </span>
                  </div>

                  {/* Ready status */}
                  <span className={player.isReady ? 'badge-ready' : 'badge-waiting'}>
                    {player.isReady ? 'Ready' : 'Waiting'}
                  </span>

                  {/* Kick button (host only, not self) */}
                  {isHost && player.userId !== myUserId && (
                    <button
                      onClick={() => kickPlayer(player.userId)}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{
                        color: 'var(--cream-dim)',
                        border: '2px solid var(--felt-border)',
                        borderRadius: '100px',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'color 150ms ease, border-color 150ms ease',
                      }}
                      title="Kick player"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, (room?.maxPlayers ?? 6) - players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{ border: '2px dashed var(--felt-border)', opacity: 0.5, borderRadius: '10px' }}
                >
                  <div className="w-8 h-8 rounded-full" style={{ background: 'var(--felt-raised)', border: '2px dashed var(--felt-border)' }} />
                  <span className="text-sm" style={{ color: 'var(--cream-dim)' }}>Waiting for player…</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* Ready toggle */}
          {me && (
            <button
              onClick={toggleReady}
              disabled={toggling}
              className="flex-1 py-3 text-sm font-medium"
              style={{
                fontFamily: 'Playfair Display, serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.78rem',
                background: me.isReady ? 'rgba(34,197,94,0.12)' : 'transparent',
                border: me.isReady ? '2px solid rgba(34,197,94,0.5)' : '2px solid var(--felt-border)',
                color: me.isReady ? '#15803d' : 'var(--cream-dim)',
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background 150ms ease, border-color 150ms ease, color 150ms ease',
              }}
            >
              {toggling ? '…' : me.isReady ? '✓ Ready' : 'Mark Ready'}
            </button>
          )}

          {/* Start game (host only) */}
          {isHost && (
            <button
              onClick={startGame}
              disabled={!allReady || starting}
              className="btn-gold flex-1 py-3 rounded text-sm"
              title={!allReady ? 'All players must be ready' : ''}
            >
              {starting ? 'Starting…' : 'Start Game'}
            </button>
          )}
        </div>

        {isHost && !allReady && players.length >= 2 && (
          <p className="text-center text-xs mt-3" style={{ color: 'var(--cream-dim)', opacity: 0.6 }}>
            All players must mark themselves ready before you can start.
          </p>
        )}

        {players.length < 2 && (
          <p className="text-center text-xs mt-3" style={{ color: 'var(--cream-dim)', opacity: 0.6 }}>
            Share the room code — you need at least 2 players.
          </p>
        )}
      </div>
    </main>
  )
}
