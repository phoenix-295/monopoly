import { GameState, Player } from './types'
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle } from './cards'

export interface StartGameInput {
  players: Array<{ id: string; name: string; turnOrder: number }>
}

export function createInitialState(input: StartGameInput): GameState {
  const sorted = [...input.players].sort((a, b) => a.turnOrder - b.turnOrder)

  const players: Player[] = sorted.map(p => ({
    id: p.id,
    name: p.name,
    cash: 1500,
    position: 0,
    jailTurns: 0,
    getOutOfJailFree: 0,
    bankrupt: false,
    turnOrder: p.turnOrder,
  }))

  return {
    players,
    properties: [],
    currentPlayerId: players[0].id,
    phase: 'rolling',
    lastDice: [1, 1],
    doublesCount: 0,
    bank: { houses: 32, hotels: 12 },
    deckChance: shuffle([...CHANCE_CARDS]),
    deckCommunity: shuffle([...COMMUNITY_CHEST_CARDS]),
    auction: null,
    pendingTrade: null,
    winner: null,
    freeParkingPot: 0,
    log: ['Game started!'],
  }
}

export function getPlayer(state: GameState, playerId: string): Player {
  const p = state.players.find(p => p.id === playerId)
  if (!p) throw new Error(`Player ${playerId} not found`)
  return p
}

export function updatePlayer(state: GameState, playerId: string, patch: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map(p => p.id === playerId ? { ...p, ...patch } : p),
  }
}

export function addLog(state: GameState, msg: string): GameState {
  return { ...state, log: [...state.log, msg] }
}

export function nextPlayer(state: GameState): string {
  const active = state.players.filter(p => !p.bankrupt)
  const idx = active.findIndex(p => p.id === state.currentPlayerId)
  return active[(idx + 1) % active.length].id
}
