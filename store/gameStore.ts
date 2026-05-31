import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type TurnPhase = 'waiting' | 'rolling' | 'moving' | 'landing' | 'buying' | 'auctioning' | 'trading' | 'end'

export interface Player {
  id: string
  username: string
  token: string
  position: number
  cash: number
  properties: string[]
  inJail: boolean
  jailTurns: number
  isBankrupt: boolean
  getOutOfJailCards: number
}

export interface GameState {
  players: Player[]
  currentTurn: string
  phase: TurnPhase
  bank: { houses: number; hotels: number }
  winner: string | null
  version: number
}

interface GameStore {
  game: GameState | null
  roomCode: string | null
  setGame: (state: GameState) => void
  setRoomCode: (code: string) => void
}

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    game: null,
    roomCode: null,
    setGame: (state) => set({ game: state }),
    setRoomCode: (code) => set({ roomCode: code }),
  }))
)
