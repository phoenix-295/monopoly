import { GameState } from './types'
import { updatePlayer } from './state'
import { PROPERTY_PRICE, HOUSE_PRICE } from './board'

// Transfer cash from payer to receiver. null = bank.
export function transferCash(
  state: GameState,
  fromId: string | null,
  toId: string | null,
  amount: number,
): GameState {
  let next = state
  if (fromId) {
    const p = next.players.find(p => p.id === fromId)!
    next = updatePlayer(next, fromId, { cash: p.cash - amount })
  }
  if (toId) {
    const p = next.players.find(p => p.id === toId)!
    next = updatePlayer(next, toId, { cash: p.cash + amount })
  }
  return next
}

export function netWorth(state: GameState, playerId: string): number {
  const player = state.players.find(p => p.id === playerId)!
  const propValue = state.properties
    .filter(p => p.ownerId === playerId)
    .reduce((sum, p) => {
      const basePrice = PROPERTY_PRICE[p.squareIndex] ?? 0
      const mortgageVal = basePrice / 2
      if (p.mortgaged) return sum + mortgageVal
      const housePrice = HOUSE_PRICE[p.squareIndex] ?? 0
      const buildings = p.hotel ? 5 * housePrice : p.houses * housePrice
      return sum + basePrice + buildings
    }, 0)
  return player.cash + propValue
}
