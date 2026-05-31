'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Board from '@/components/board/Board'
import PropertyCard from '@/components/board/PropertyCard'
import Dice from '@/components/board/Dice'
import PlayerPanel, { PanelPlayer } from '@/components/board/PlayerPanel'
import EventLog, { GameEvent } from '@/components/board/EventLog'
import WinScreen from '@/components/game/WinScreen'
import OfflineBanner from '@/components/game/OfflineBanner'
import AuctionPanel from '@/components/game/AuctionPanel'
import PropertyManager from '@/components/game/PropertyManager'
import TradeModal from '@/components/game/TradeModal'
import { BOARD, BoardSquare, SQUARE_POSITIONS } from '@/lib/board-data'
import { useGameStore } from '@/store/gameStore'
import { useSound } from '@/hooks/useSound'
import type { GameState } from '@/lib/game-engine'

const PLAYER_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#F97316',
  '#EC4899', '#8B5CF6', '#EAB308', '#06B6D4',
]

const TOKEN_EMOJI: Record<string, string> = {
  top_hat: '🎩', car: '🚗', dog: '🐕', ship: '⛵', iron: '🪂', boot: '👞',
}

interface RoomPlayer {
  userId: string
  token: string | null
  turnOrder: number
  username: string
  color: string
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const play = useSound()

  const { game, setGame, setRoomCode, setMyUserId, dispatch, myUserId } = useGameStore()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([])
  const [selectedSquare, setSelectedSquare] = useState<BoardSquare | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [boardScale, setBoardScale] = useState(1)
  const [viewMode, setViewMode] = useState<'fit' | 'zoom'>('fit')
  const [activeTradePartnerId, setActiveTradePartnerId] = useState<string | null>(null)
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<string[]>([])
  const boardContainerRef = useRef<HTMLDivElement>(null)

  function getSquareCoordinates(index: number) {
    const pos = SQUARE_POSITIONS[index]
    if (!pos) return { x: 351, y: 351 }
    const SQ = 54
    const CORNER = 108
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

  const centerOnSquare = useCallback((squareIndex: number, scaleVal = boardScale) => {
    if (!boardContainerRef.current) return
    const container = boardContainerRef.current
    const { x, y } = getSquareCoordinates(squareIndex)
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    container.scrollTo({
      left: x * scaleVal - containerWidth / 2,
      top: y * scaleVal - containerHeight / 2,
      behavior: 'smooth'
    })
  }, [boardScale])

  const prevLogLen = useRef(0)
  const prevGameRef = useRef<GameState | null>(null)

  function detectAndPlaySounds(prev: GameState | null, next: GameState) {
    if (!prev) return
    // Dice rolled
    if (next.lastDice[0] !== prev.lastDice[0] || next.lastDice[1] !== prev.lastDice[1]) {
      play('dice')
    }
    // Player moved
    for (const p of next.players) {
      const old = prev.players.find(op => op.id === p.id)
      if (old && old.position !== p.position) play('move')
      if (old && !old.bankrupt && p.bankrupt) play('jail') // bankruptcy
    }
    // Property bought
    if (next.properties.length > prev.properties.length) play('buy')
    // Phase changed to auctioning
    if (prev.phase !== 'auctioning' && next.phase === 'auctioning') play('buy')
    // Someone went to jail (position changed to 10 via sendToJail)
    for (const p of next.players) {
      const old = prev.players.find(op => op.id === p.id)
      if (old && old.jailTurns === 0 && p.jailTurns > 0) play('jail')
    }
    // Game over
    if (!prev.winner && next.winner) play('win')
  }

  function emitLogEntries(state: GameState) {
    const newEntries = state.log.slice(prevLogLen.current)
    prevLogLen.current = state.log.length
    if (newEntries.length === 0) return
    setEvents(prev => [
      ...prev,
      ...newEntries.map(text => ({
        id: String(Date.now() + Math.random()),
        text,
        type: 'system' as const,
        timestamp: Date.now(),
      })),
    ])
  }

  const loadGame = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setMyUserId(user.id)
    setRoomCode(code)

    const { data: roomData } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('code', code)
      .single()

    if (!roomData) { setError('Room not found'); return }
    if (roomData.status !== 'active') { router.push(`/lobby/${code}`); return }

    setRoomId(roomData.id)

    const { data: playersData } = await supabase
      .from('room_players')
      .select('user_id, token, turn_order, profiles(username)')
      .eq('room_id', roomData.id)
      .order('turn_order')

    if (playersData) {
      const players: RoomPlayer[] = playersData.map((p: Record<string, unknown>, i: number) => ({
        userId: p.user_id as string,
        token: p.token as string | null,
        turnOrder: p.turn_order as number,
        username: Array.isArray(p.profiles)
          ? (p.profiles[0] as { username: string })?.username ?? 'Unknown'
          : (p.profiles as { username: string } | null)?.username ?? 'Unknown',
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      }))
      setRoomPlayers(players)
    }

    const { data: gsData } = await supabase
      .from('game_state')
      .select('state')
      .eq('room_id', roomData.id)
      .single()

    if (gsData?.state) {
      const gs = gsData.state as unknown as GameState
      prevLogLen.current = gs.log.length
      prevGameRef.current = gs
      setGame(gs)
      if (gs.winner) setShowWin(true)
      setEvents(gs.log.map((text, i) => ({
        id: String(i),
        text,
        type: 'system' as const,
        timestamp: Date.now(),
      })))
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!roomId || !myUserId) return

    const channel = supabase
      .channel(`game:${roomId}`, {
        config: { presence: { key: myUserId } }
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newState = payload.new.state as unknown as GameState
          detectAndPlaySounds(prevGameRef.current, newState)
          prevGameRef.current = newState
          setGame(newState)
          emitLogEntries(newState)
          if (newState.winner) setShowWin(true)
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineIds = Object.keys(state)
        setOnlinePlayerIds(onlineIds)
      })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, myUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMyTurn = !!game && game.currentPlayerId === myUserId
  const myPlayer = game?.players.find(p => p.id === myUserId)
  const currentPhase = game?.phase ?? 'waiting'
  const isMyAuctionTurn = game?.auction?.currentBidderId === myUserId

  useEffect(() => { loadGame() }, [loadGame])

  // Scale board to fill available space — measure window to avoid feedback loop
  useEffect(() => {
    const BOARD_PX = 702
    const PADDING = 32       // 1rem each side
    const LEFT_SIDEBAR = 220
    const RIGHT_SIDEBAR = 300
    const GAPS = 32          // two 1rem gaps

    const update = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const isMobile = w <= 900
      
      if (isMobile && viewMode === 'zoom') {
        setBoardScale(0.85)
        return
      }

      const availableWidth = isMobile
        ? w - PADDING
        : w - PADDING - LEFT_SIDEBAR - RIGHT_SIDEBAR - GAPS

      // Calculate scale to fit both width and height (excluding top bar/margins ~175px)
      const scaleByWidth = availableWidth / BOARD_PX
      const scaleByHeight = (h - 175) / BOARD_PX
      
      setBoardScale(Math.max(0.35, Math.min(scaleByWidth, scaleByHeight, 1.6)))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [viewMode])

  useEffect(() => {
    if (viewMode === 'zoom' && myPlayer !== undefined) {
      const timer = setTimeout(() => {
        centerOnSquare(myPlayer.position, 0.85)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [viewMode, myPlayer, centerOnSquare])

  async function act(action: Parameters<typeof dispatch>[0]) {
    if (acting) return
    setActing(true)
    const result = await dispatch(action)
    setActing(false)
    if (!result.ok) {
      if (result.status === 409) {
        loadGame()
      } else if (result.error) {
        alert(result.error)
      }
    }
  }

  function handleRollComplete() {
    if (!isMyTurn || (currentPhase !== 'rolling' && currentPhase !== 'in_jail')) return
    act({ type: 'ROLL_DICE', playerId: myUserId! })
  }

  function handleSquareClick(squareIndex: number) {
    const square = BOARD[squareIndex]
    if (['property', 'railroad', 'utility', 'income-tax', 'luxury-tax'].includes(square.type)) {
      setSelectedSquare(square)
    }
  }

  // Derive token positions + player maps
  const tokenPositions: Record<string, number> = {}
  const playerColorMap: Record<string, string> = {}
  const playerEmojiMap: Record<string, string> = {}

  roomPlayers.forEach((rp, i) => {
    playerColorMap[rp.userId] = PLAYER_COLORS[i % PLAYER_COLORS.length]
    playerEmojiMap[rp.userId] = rp.token ? TOKEN_EMOJI[rp.token] ?? '🎲' : '🎲'
  })

  if (game) {
    game.players.forEach(p => { tokenPositions[p.id] = p.position })
  }

  const propertyOwners: Record<number, string> = {}
  const propertyBuildings: Record<number, { houses: number; hotel: boolean }> = {}
  if (game) {
    game.properties.forEach(p => {
      if (playerColorMap[p.ownerId]) {
        propertyOwners[p.squareIndex] = playerColorMap[p.ownerId]
      }
      propertyBuildings[p.squareIndex] = {
        houses: p.houses,
        hotel: p.hotel,
      }
    })
  }

  const panelPlayers: PanelPlayer[] = roomPlayers.map(rp => {
    const enginePlayer = game?.players.find(p => p.id === rp.userId)
    return {
      id: rp.userId,
      username: rp.username,
      token: rp.token,
      cash: enginePlayer?.cash ?? 1500,
      position: enginePlayer?.position ?? 0,
      isCurrentTurn: game?.currentPlayerId === rp.userId,
      color: rp.color,
      isOnline: onlinePlayerIds.length === 0 || onlinePlayerIds.includes(rp.userId),
    }
  })

  const winnerName = game?.winner
    ? (game.players.find(p => p.id === game.winner)?.name ?? 'Someone')
    : null

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
    <>
      <OfflineBanner />

      {showWin && winnerName && (
        <WinScreen winnerName={winnerName} onClose={() => router.push('/lobby')} />
      )}

      <main style={{ minHeight: '100vh', padding: '0.4rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {/* Top bar */}
        <div className="game-topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                MONOPOLY
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--cream-dim)', fontFamily: 'monospace' }}>Room: {code}</span>
            </div>
            {game && (
              <div style={{ fontSize: '0.7rem', color: 'var(--cream-dim)', display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '3px' }}>
                <span style={{ background: 'var(--felt-raised)', border: '1.2px solid var(--felt-border)', borderRadius: 100, padding: '0.05rem 0.4rem', fontFamily: 'monospace', fontSize: '0.62rem', lineHeight: 1 }}>{currentPhase}</span>
                {isMyTurn
                  ? <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Your turn</span>
                  : <span>Waiting for <strong style={{ color: 'var(--cream)' }}>{game.players.find(p => p.id === game.currentPlayerId)?.name ?? '…'}</strong></span>
                }
              </div>
            )}
          </div>

          <div className="game-topbar-actions">
            <Dice
              values={game?.lastDice ?? [1, 1]}
              disabled={!isMyTurn || (currentPhase !== 'rolling' && currentPhase !== 'in_jail') || acting}
              onRoll={handleRollComplete}
            />

            {isMyTurn && currentPhase === 'buying' && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn-gold" disabled={acting} onClick={() => act({ type: 'BUY_PROPERTY', playerId: myUserId! })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>Buy</button>
                <button className="btn-ghost" disabled={acting} onClick={() => act({ type: 'DECLINE_BUY', playerId: myUserId! })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>Decline</button>
              </div>
            )}

            {isMyTurn && currentPhase === 'in_jail' && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(myPlayer?.getOutOfJailFree ?? 0) > 0 && (
                  <button className="btn-gold" disabled={acting} onClick={() => act({ type: 'USE_JAIL_CARD', playerId: myUserId! })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>Use Card</button>
                )}
                {(myPlayer?.cash ?? 0) >= 50 && (
                  <button className="btn-ghost" disabled={acting} onClick={() => act({ type: 'PAY_JAIL_FINE', playerId: myUserId! })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>Pay $50</button>
                )}
              </div>
            )}

            {isMyTurn && currentPhase === 'end_turn' && (
              <button className="btn-ghost" disabled={acting} onClick={() => act({ type: 'END_TURN', playerId: myUserId! })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>End Turn</button>
            )}

            {isMyTurn && (myPlayer?.cash ?? 0) < 0 && (
              <button disabled={acting} onClick={() => act({ type: 'DECLARE_BANKRUPTCY', playerId: myUserId!, creditorId: null })} style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', borderRadius: 100, border: '1.5px solid #f87171', color: '#f87171', background: 'transparent', cursor: 'pointer' }}>
                Bankrupt
              </button>
            )}

            <button onClick={() => router.push('/lobby')} className="btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem' }}>Leave</button>
          </div>
        </div>



        {/* Main layout */}
        <div 
          className="game-layout" 
          style={{ 
            maxWidth: `${220 + 300 + 48 + boardScale * 702}px`, 
            margin: '0 auto', 
            width: '100%' 
          }}
        >
          {/* Left sidebar */}
          <div className="game-sidebar-left">
            <PlayerPanel 
              players={panelPlayers} 
              myId={myUserId ?? ''} 
              onSelectPlayer={id => {
                if (id !== myUserId) setActiveTradePartnerId(id)
              }}
            />

            {game?.auction && game.players.length > 0 && (
              <AuctionPanel
                auction={game.auction}
                players={game.players}
                myUserId={myUserId ?? ''}
                isMyBidTurn={!!isMyAuctionTurn}
                acting={acting}
                onBid={amount => act({ type: 'BID', playerId: myUserId!, amount })}
                onPass={() => act({ type: 'PASS_BID', playerId: myUserId! })}
              />
            )}

            {game && (
              <PropertyManager
                game={game}
                myUserId={myUserId ?? ''}
                isMyTurn={isMyTurn}
                acting={acting}
                onBuild={(sq, n) => act({ type: 'BUILD', playerId: myUserId!, squareIndex: sq, count: n })}
                onSell={(sq, n) => act({ type: 'SELL_HOUSES', playerId: myUserId!, squareIndex: sq, count: n })}
                onMortgage={sq => act({ type: 'MORTGAGE', playerId: myUserId!, squareIndex: sq })}
                onUnmortgage={sq => act({ type: 'UNMORTGAGE', playerId: myUserId!, squareIndex: sq })}
                onBankrupt={() => act({ type: 'DECLARE_BANKRUPTCY', playerId: myUserId!, creditorId: null })}
                onSquareClick={handleSquareClick}
              />
            )}
          </div>

          {/* Board */}
          <div className="game-board-outer-wrap" style={{ position: 'relative' }}>
            <div 
              ref={boardContainerRef} 
              className="game-board-wrap"
              style={viewMode === 'zoom' ? {
                overflow: 'auto',
                scrollBehavior: 'smooth',
                maxHeight: '80vh',
              } : {
                overflow: 'visible',
              }}
            >
              <div style={{
                width: boardScale * 702,
                height: boardScale * 702,
                flexShrink: 0,
                position: 'relative',
                margin: 'auto',
              }}>
                <div style={{
                  transform: `scale(${boardScale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}>
                  <Board
                    tokenPositions={tokenPositions}
                    playerColors={playerColorMap}
                    playerEmojis={playerEmojiMap}
                    onSquareClick={handleSquareClick}
                    highlightSquare={myPlayer?.position}
                    highlightColor={myUserId ? playerColorMap[myUserId] : undefined}
                    propertyOwners={propertyOwners}
                    propertyBuildings={propertyBuildings}
                  />
                </div>
              </div>
            </div>

            {/* Floating Mobile Controls */}
            <div className="board-mobile-controls">
              <button 
                onClick={() => setViewMode(prev => prev === 'fit' ? 'zoom' : 'fit')} 
                className="btn-mobile-ctrl"
              >
                {viewMode === 'fit' ? '🔍 Zoom Board' : '📱 Fit Screen'}
              </button>
              {viewMode === 'zoom' && myPlayer && (
                <button 
                  onClick={() => centerOnSquare(myPlayer.position)} 
                  className="btn-mobile-ctrl animate-fade-up"
                  style={{ animationDuration: '150ms' }}
                >
                  🎯 Center Me
                </button>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="game-sidebar-right">
            <EventLog
              events={events}
              playerNameColors={Object.fromEntries(
                roomPlayers.map(rp => [rp.username, rp.color])
              )}
            />
          </div>
        </div>

        <PropertyCard square={selectedSquare} onClose={() => setSelectedSquare(null)} />

        {activeTradePartnerId && game && myUserId && (
          <TradeModal
            game={game}
            myUserId={myUserId}
            partnerId={activeTradePartnerId}
            onClose={() => setActiveTradePartnerId(null)}
            onPropose={offer => {
              act({ type: 'PROPOSE_TRADE', offer })
              setActiveTradePartnerId(null)
            }}
          />
        )}

        {game?.pendingTrade && game.pendingTrade.toPlayerId === myUserId && (
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
          >
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                borderRadius: 16,
                background: 'var(--felt-card)',
                border: '2px solid var(--felt-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center',
              }}
            >
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 900, color: 'var(--cream)', margin: 0 }}>
                🤝 Incoming Trade Offer!
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', margin: 0 }}>
                <strong>{game.players.find(p => p.id === game.pendingTrade!.fromPlayerId)?.name}</strong> has proposed a trade.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left', background: 'var(--felt-raised)', padding: '1rem', borderRadius: 10, border: '1px solid var(--felt-border)' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', color: 'var(--gold)', margin: '0 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>They Offer:</h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--cream)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {game.pendingTrade.offer.cash > 0 && <span>• Cash: ${game.pendingTrade.offer.cash}</span>}
                    {game.pendingTrade.offer.getOutOfJailFree > 0 && <span>• Jail Cards: {game.pendingTrade.offer.getOutOfJailFree}</span>}
                    {game.pendingTrade.offer.propertyIndices.map(idx => (
                      <span key={idx}>• {BOARD[idx].name}</span>
                    ))}
                    {game.pendingTrade.offer.cash === 0 && game.pendingTrade.offer.getOutOfJailFree === 0 && game.pendingTrade.offer.propertyIndices.length === 0 && (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Nothing</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', color: 'var(--gold)', margin: '0 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>They Request:</h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--cream)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {game.pendingTrade.request.cash > 0 && <span>• Cash: ${game.pendingTrade.request.cash}</span>}
                    {game.pendingTrade.request.getOutOfJailFree > 0 && <span>• Jail Cards: {game.pendingTrade.request.getOutOfJailFree}</span>}
                    {game.pendingTrade.request.propertyIndices.map(idx => (
                      <span key={idx}>• {BOARD[idx].name}</span>
                    ))}
                    {game.pendingTrade.request.cash === 0 && game.pendingTrade.request.getOutOfJailFree === 0 && game.pendingTrade.request.propertyIndices.length === 0 && (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Nothing</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => act({ type: 'DECLINE_TRADE', playerId: myUserId! })}
                  disabled={acting}
                  style={{ flex: 1, padding: '0.5rem', background: '#DC2626', border: 'none', color: '#fff', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject Trade
                </button>
                <button
                  onClick={() => act({ type: 'ACCEPT_TRADE', playerId: myUserId! })}
                  disabled={acting}
                  style={{ flex: 1, padding: '0.5rem', background: '#16A34A', border: 'none', color: '#fff', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Accept Trade
                </button>
              </div>
            </div>
          </div>
        )}

        {game?.pendingTrade && game.pendingTrade.fromPlayerId === myUserId && (
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
          >
            <div
              style={{
                width: '100%',
                maxWidth: 380,
                borderRadius: 16,
                background: 'var(--felt-card)',
                border: '2px solid var(--felt-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center',
              }}
            >
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 900, color: 'var(--cream)', margin: 0 }}>
                ⏳ Trade Proposed
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', margin: 0 }}>
                Waiting for <strong>{game.players.find(p => p.id === game.pendingTrade!.toPlayerId)?.name}</strong> to review your proposal...
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--felt-border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
              <button
                onClick={() => act({ type: 'DECLINE_TRADE', playerId: myUserId! })}
                disabled={acting}
                style={{ padding: '0.5rem', background: 'transparent', border: '1px solid #DC2626', color: '#DC2626', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel Trade Offer
              </button>
            </div>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
      </main>
    </>
  )
}
