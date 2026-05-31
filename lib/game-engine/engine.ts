import { GameState, GameAction } from './types'
import { getPlayer, updatePlayer, addLog, nextPlayer } from './state'
import { movePlayer, sendToJail } from './movement'
import { resolveLanding } from './landing'
import { buildHouse, sellHouses } from './building'
import { mortgageProperty, unmortgageProperty } from './mortgage'
import { startAuction, placeBid, passBid } from './auction'
import { declareBankruptcy } from './bankruptcy'
import { proposeTrade, acceptTrade, declineTrade } from './trading'
import { transferCash } from './finance'
import { PROPERTY_PRICE, JAIL_INDEX, isPurchasable } from './board'

const MAX_DOUBLES = 3
const JAIL_FINE = 50

export function gameEngine(state: GameState, action: GameAction): GameState {
  if (state.phase === 'game_over') return state

  switch (action.type) {
    case 'ROLL_DICE':
      return handleRoll(state, action.playerId)

    case 'BUY_PROPERTY':
      return handleBuy(state, action.playerId)

    case 'DECLINE_BUY':
      return handleDeclineBuy(state, action.playerId)

    case 'BID':
      return placeBid(state, action.playerId, action.amount)

    case 'PASS_BID':
      return passBid(state, action.playerId)

    case 'BUILD':
      return buildHouse(state, action.playerId, action.squareIndex, action.count)

    case 'SELL_HOUSES':
      return sellHouses(state, action.playerId, action.squareIndex, action.count)

    case 'MORTGAGE':
      return mortgageProperty(state, action.playerId, action.squareIndex)

    case 'UNMORTGAGE':
      return unmortgageProperty(state, action.playerId, action.squareIndex)

    case 'PAY_JAIL_FINE':
      return handlePayJailFine(state, action.playerId)

    case 'USE_JAIL_CARD':
      return handleUseJailCard(state, action.playerId)

    case 'PROPOSE_TRADE':
      return proposeTrade(state, action.offer)

    case 'ACCEPT_TRADE':
      return acceptTrade(state, action.playerId)

    case 'DECLINE_TRADE':
      return declineTrade(state, action.playerId)

    case 'END_TURN':
      return handleEndTurn(state, action.playerId)

    case 'DECLARE_BANKRUPTCY':
      return declareBankruptcy(state, action.playerId, action.creditorId)

    default:
      return state
  }
}

function handleRoll(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')
  if (state.phase !== 'rolling' && state.phase !== 'in_jail') throw new Error(`Cannot roll in phase: ${state.phase}`)

  const d1 = Math.ceil(Math.random() * 6)
  const d2 = Math.ceil(Math.random() * 6)
  const dice: [number, number] = [d1, d2]
  const total = d1 + d2
  const doubles = d1 === d2

  let next: GameState = { ...state, lastDice: dice }
  const player = getPlayer(next, playerId)
  next = addLog(next, `${player.name} rolled ${d1}+${d2}=${total}${doubles ? ' (doubles!)' : ''}.`)

  // Jail handling
  if (player.jailTurns > 0) {
    if (doubles) {
      // Get out free on doubles
      next = updatePlayer(next, playerId, { jailTurns: 0 })
      next = addLog(next, `${player.name} rolled doubles and got out of jail!`)
    } else {
      const remaining = player.jailTurns - 1
      next = updatePlayer(next, playerId, { jailTurns: remaining })
      if (remaining === 0) {
        // Must pay fine
        next = transferCash(next, playerId, null, JAIL_FINE)
        next = addLog(next, `${player.name} must pay $${JAIL_FINE} to leave jail.`)
      } else {
        next = addLog(next, `${player.name} stays in jail (${remaining} turns left).`)
        return { ...next, phase: 'end_turn' }
      }
    }
  }

  // Doubles tracking (not in jail)
  if (doubles && player.jailTurns === 0) {
    const newDoubles = state.doublesCount + 1
    next = { ...next, doublesCount: newDoubles }
    if (newDoubles >= MAX_DOUBLES) {
      next = addLog(next, `${player.name} rolled 3 doubles — go to Jail!`)
      next = sendToJail(next, playerId)
      return { ...next, phase: 'end_turn', doublesCount: 0 }
    }
  } else {
    next = { ...next, doublesCount: 0 }
  }

  // Move player
  const { state: moved } = movePlayer(next, playerId, total)
  next = moved

  // Resolve landing
  const { state: landed, landingAction } = resolveLanding(next, playerId)
  next = landed

  // Determine next phase
  if (landingAction === 'offer_buy') {
    return { ...next, phase: 'buying' }
  }
  if (landingAction === 'go_to_jail') {
    return { ...next, phase: 'end_turn', doublesCount: 0 }
  }
  // After cards/rent/tax, go to end_turn (or rolling again on doubles)
  if (doubles && state.doublesCount + 1 < MAX_DOUBLES && player.jailTurns === 0) {
    return { ...next, phase: 'rolling' }
  }
  return { ...next, phase: 'end_turn' }
}

function handleBuy(state: GameState, playerId: string): GameState {
  if (state.phase !== 'buying') throw new Error('Not in buying phase')
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')

  const player = getPlayer(state, playerId)
  const squareIndex = player.position
  const price = PROPERTY_PRICE[squareIndex]
  if (price === undefined) throw new Error('Not a purchasable square')
  if (player.cash < price) throw new Error('Insufficient funds')

  let next = transferCash(state, playerId, null, price)
  next = {
    ...next,
    properties: [
      ...next.properties,
      { squareIndex, ownerId: playerId, houses: 0, hotel: false, mortgaged: false },
    ],
    phase: 'end_turn',
  }
  next = addLog(next, `${player.name} bought sq.${squareIndex} for $${price}.`)
  return next
}

function handleDeclineBuy(state: GameState, playerId: string): GameState {
  if (state.phase !== 'buying') throw new Error('Not in buying phase')
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')

  const player = getPlayer(state, playerId)
  let next = addLog(state, `${player.name} declined to buy sq.${player.position}. Auction starting.`)
  return startAuction(next, player.position)
}

function handlePayJailFine(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')
  const player = getPlayer(state, playerId)
  if (player.jailTurns === 0) throw new Error('Not in jail')
  if (player.cash < JAIL_FINE) throw new Error('Insufficient funds')

  let next = transferCash(state, playerId, null, JAIL_FINE)
  next = updatePlayer(next, playerId, { jailTurns: 0 })
  next = addLog(next, `${player.name} paid $${JAIL_FINE} jail fine and is free.`)
  return { ...next, phase: 'rolling' }
}

function handleUseJailCard(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')
  const player = getPlayer(state, playerId)
  if (player.jailTurns === 0) throw new Error('Not in jail')
  if (player.getOutOfJailFree === 0) throw new Error('No Get Out of Jail Free card')

  let next = updatePlayer(state, playerId, {
    jailTurns: 0,
    getOutOfJailFree: player.getOutOfJailFree - 1,
  })
  next = addLog(next, `${player.name} used a Get Out of Jail Free card!`)
  return { ...next, phase: 'rolling' }
}

function handleEndTurn(state: GameState, playerId: string): GameState {
  if (state.currentPlayerId !== playerId) throw new Error('Not your turn')
  if (!['end_turn', 'rolling'].includes(state.phase)) {
    throw new Error(`Cannot end turn in phase: ${state.phase}`)
  }

  const nextId = nextPlayer(state)
  const nextP = getPlayer(state, nextId)
  const phase = nextP.jailTurns > 0 ? 'in_jail' : 'rolling'

  let next: GameState = { ...state, currentPlayerId: nextId, phase, doublesCount: 0 }
  next = addLog(next, `--- ${nextP.name}'s turn ---`)
  return next
}
