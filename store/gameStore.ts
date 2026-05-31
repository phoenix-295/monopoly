import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GameState, GameAction } from '@/lib/game-engine'

interface GameStore {
  game: GameState | null
  roomCode: string | null
  roomId: string | null
  isMyTurn: boolean
  myUserId: string | null
  setGame: (state: GameState) => void
  setRoomCode: (code: string) => void
  setRoomId: (id: string) => void
  setMyUserId: (id: string) => void
  dispatch: (action: GameAction) => Promise<{ ok: boolean; error?: string; status?: number }>
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    game: null,
    roomCode: null,
    roomId: null,
    myUserId: null,
    get isMyTurn() {
      const { game, myUserId } = get()
      return !!game && game.currentPlayerId === myUserId
    },
    setGame: (state) => set({ game: state }),
    setRoomCode: (code) => set({ roomCode: code }),
    setRoomId: (id) => set({ roomId: id }),
    setMyUserId: (id) => set({ myUserId: id }),
    dispatch: async (action) => {
      const { roomCode } = get()
      if (!roomCode) return { ok: false, error: 'No room code', status: 400 }

      const res = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, action }),
      })

      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error, status: res.status }

      // Realtime will push the update; optimistically update local state too
      set({ game: data.state })
      return { ok: true }
    },
  }))
)
