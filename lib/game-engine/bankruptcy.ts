import { GameState } from './types'
import { addLog, updatePlayer } from './state'

export function declareBankruptcy(
  state: GameState,
  playerId: string,
  creditorId: string | null,
): GameState {
  const player = state.players.find(p => p.id === playerId)!

  // Transfer all assets to creditor or bank
  let next: GameState
  if (creditorId) {
    const creditor = state.players.find(p => p.id === creditorId)!
    // Transfer cash
    next = updatePlayer(state, creditorId, { cash: creditor.cash + player.cash })
    // Transfer properties
    next = {
      ...next,
      properties: next.properties.map(p =>
        p.ownerId === playerId
          ? { ...p, ownerId: creditorId, mortgaged: true, houses: 0, hotel: false }
          : p
      ),
    }
    next = addLog(next, `${player.name} went bankrupt! Assets transferred to ${creditor.name}.`)
  } else {
    // Bank: remove properties, lose cash
    next = {
      ...state,
      properties: state.properties.filter(p => p.ownerId !== playerId),
    }
    next = addLog(next, `${player.name} went bankrupt! Assets returned to bank.`)
  }

  // Mark player bankrupt and zero out
  next = updatePlayer(next, playerId, { bankrupt: true, cash: 0 })

  // Return houses/hotels to bank
  const returnHouses = state.properties
    .filter(p => p.ownerId === playerId)
    .reduce((sum, p) => sum + (p.hotel ? 0 : p.houses), 0)
  const returnHotels = state.properties
    .filter(p => p.ownerId === playerId && p.hotel)
    .length

  next = {
    ...next,
    bank: {
      houses: next.bank.houses + returnHouses,
      hotels: next.bank.hotels + returnHotels,
    },
  }

  // Check win condition
  const activePlayers = next.players.filter(p => !p.bankrupt)
  if (activePlayers.length === 1) {
    next = { ...next, phase: 'game_over', winner: activePlayers[0].id }
    next = addLog(next, `${activePlayers[0].name} wins the game!`)
  }

  return next
}
