import { GameState, Card } from './types'
import {
  GO_TO_JAIL_INDEX, INCOME_TAX_INDEX, LUXURY_TAX_INDEX,
  INCOME_TAX_AMOUNT, LUXURY_TAX_AMOUNT,
  CHANCE_INDICES, COMMUNITY_CHEST_INDICES,
  isPurchasable, isProperty, isRailroad, isUtility,
  nearestRailroad, nearestUtility,
} from './board'
import { sendToJail, movePlayerTo, movePlayer } from './movement'
import { calculateRent, getProperty } from './rent'
import { updatePlayer, addLog } from './state'
import { transferCash } from './finance'

export interface LandingResult {
  state: GameState
  landingAction:
    | 'offer_buy'
    | 'pay_rent'
    | 'go_to_jail'
    | 'tax'
    | 'free'
    | 'card'
    | 'auction'
}

export function resolveLanding(state: GameState, playerId: string): LandingResult {
  const player = state.players.find(p => p.id === playerId)!
  const pos = player.position

  // Go To Jail
  if (pos === GO_TO_JAIL_INDEX) {
    return { state: sendToJail(state, playerId), landingAction: 'go_to_jail' }
  }

  // Taxes
  if (pos === INCOME_TAX_INDEX) {
    let next = transferCash(state, playerId, null, INCOME_TAX_AMOUNT)
    next = addLog(next, `${player.name} paid Income Tax of ₹${INCOME_TAX_AMOUNT}.`)
    return { state: next, landingAction: 'tax' }
  }
  if (pos === LUXURY_TAX_INDEX) {
    let next = transferCash(state, playerId, null, LUXURY_TAX_AMOUNT)
    next = addLog(next, `${player.name} paid Luxury Tax of ₹${LUXURY_TAX_AMOUNT}.`)
    return { state: next, landingAction: 'tax' }
  }

  // Chance
  if (CHANCE_INDICES.includes(pos)) {
    const [card, ...rest] = state.deckChance
    const next = { ...state, deckChance: [...rest, card] }
    return { state: applyCard(next, playerId, card), landingAction: 'card' }
  }

  // Community Chest
  if (COMMUNITY_CHEST_INDICES.includes(pos)) {
    const [card, ...rest] = state.deckCommunity
    const next = { ...state, deckCommunity: [...rest, card] }
    return { state: applyCard(next, playerId, card), landingAction: 'card' }
  }

  // Purchasable squares
  if (isPurchasable(pos)) {
    const prop = getProperty(state, pos)

    if (!prop) {
      // Unowned — offer to buy
      return { state, landingAction: 'offer_buy' }
    }

    if (prop.ownerId === playerId || prop.mortgaged) {
      return { state, landingAction: 'free' }
    }

    // Owned by someone else — pay rent
    const diceTotal = state.lastDice[0] + state.lastDice[1]
    const rent = calculateRent(state, pos, prop, diceTotal)
    let next = transferCash(state, playerId, prop.ownerId, rent)
    const owner = state.players.find(p => p.id === prop.ownerId)!
    next = addLog(next, `${player.name} paid ₹${rent} rent to ${owner.name}.`)
    return { state: next, landingAction: 'pay_rent' }
  }

  // Go, Jail (just visiting), Free Parking — nothing
  return { state, landingAction: 'free' }
}

function applyCard(state: GameState, playerId: string, card: Card): GameState {
  const player = state.players.find(p => p.id === playerId)!
  let next = addLog(state, `${player.name} drew: "${card.text}"`)
  const action = card.action

  switch (action.type) {
    case 'move_to': {
      const { state: moved } = movePlayerTo(next, playerId, action.squareIndex, action.collectGo)
      const result = resolveLanding(moved, playerId)
      return result.state
    }

    case 'move_by': {
      const { state: moved } = movePlayer(next, playerId, action.steps)
      const result = resolveLanding(moved, playerId)
      return result.state
    }

    case 'move_to_nearest': {
      const p = state.players.find(p => p.id === playerId)!
      const target = action.squareType === 'railroad'
        ? nearestRailroad(p.position)
        : nearestUtility(p.position)
      const { state: moved } = movePlayerTo(next, playerId, target, true)
      const result = resolveLanding(moved, playerId)
      return result.state
    }

    case 'pay_bank':
      return transferCash(next, playerId, null, action.amount)

    case 'collect_bank':
      return transferCash(next, null, playerId, action.amount)

    case 'collect_all_players': {
      let s = next
      for (const other of s.players.filter(p => p.id !== playerId && !p.bankrupt)) {
        s = transferCash(s, other.id, playerId, action.amount)
      }
      return s
    }

    case 'pay_all_players': {
      let s = next
      for (const other of s.players.filter(p => p.id !== playerId && !p.bankrupt)) {
        s = transferCash(s, playerId, other.id, action.amount)
      }
      return s
    }

    case 'go_to_jail':
      return sendToJail(next, playerId)

    case 'get_out_of_jail_free': {
      const p = state.players.find(p => p.id === playerId)!
      return updatePlayer(next, playerId, { getOutOfJailFree: p.getOutOfJailFree + 1 })
    }

    case 'pay_repairs': {
      const houses = state.properties
        .filter(p => p.ownerId === playerId)
        .reduce((sum, p) => sum + (p.hotel ? 0 : p.houses), 0)
      const hotels = state.properties
        .filter(p => p.ownerId === playerId && p.hotel)
        .length
      const total = houses * action.perHouse + hotels * action.perHotel
      return transferCash(next, playerId, null, total)
    }

    default:
      return next
  }
}
