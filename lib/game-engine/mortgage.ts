import { GameState } from './types'
import { PROPERTY_PRICE } from './board'
import { getProperty } from './rent'
import { addLog } from './state'
import { transferCash } from './finance'

export function mortgageProperty(state: GameState, playerId: string, squareIndex: number): GameState {
  const prop = getProperty(state, squareIndex)
  if (!prop || prop.ownerId !== playerId) throw new Error('You do not own this property')
  if (prop.mortgaged) throw new Error('Already mortgaged')
  if (prop.houses > 0 || prop.hotel) throw new Error('Sell all buildings before mortgaging')

  const price = PROPERTY_PRICE[squareIndex] ?? 0
  const mortgageValue = Math.floor(price / 2)

  let next = {
    ...state,
    properties: state.properties.map(p =>
      p.squareIndex === squareIndex ? { ...p, mortgaged: true } : p
    ),
  }
  next = transferCash(next, null, playerId, mortgageValue)
  next = addLog(next, `${state.players.find(p => p.id === playerId)!.name} mortgaged sq.${squareIndex} for ₹${mortgageValue}.`)
  return next
}

export function unmortgageProperty(state: GameState, playerId: string, squareIndex: number): GameState {
  const prop = getProperty(state, squareIndex)
  if (!prop || prop.ownerId !== playerId) throw new Error('You do not own this property')
  if (!prop.mortgaged) throw new Error('Not mortgaged')

  const price = PROPERTY_PRICE[squareIndex] ?? 0
  const mortgageValue = Math.floor(price / 2)
  const unmortgageCost = Math.floor(mortgageValue * 1.1)

  const player = state.players.find(p => p.id === playerId)!
  if (player.cash < unmortgageCost) throw new Error(`Need ₹${unmortgageCost} to unmortgage`)

  let next = {
    ...state,
    properties: state.properties.map(p =>
      p.squareIndex === squareIndex ? { ...p, mortgaged: false } : p
    ),
  }
  next = transferCash(next, playerId, null, unmortgageCost)
  next = addLog(next, `${player.name} unmortgaged sq.${squareIndex} for ₹${unmortgageCost}.`)
  return next
}
