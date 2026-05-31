import { GameState, TradeOffer } from './types'
import { addLog, updatePlayer } from './state'

export function proposeTrade(state: GameState, offer: TradeOffer): GameState {
  // Validate sender has the properties and cash
  const from = state.players.find(p => p.id === offer.fromPlayerId)!
  if (from.cash < offer.offer.cash) throw new Error('Insufficient cash to offer')
  if (from.getOutOfJailFree < offer.offer.getOutOfJailFree) throw new Error('Insufficient GOOJF cards')
  for (const idx of offer.offer.propertyIndices) {
    const prop = state.properties.find(p => p.squareIndex === idx)
    if (!prop || prop.ownerId !== offer.fromPlayerId) throw new Error(`You don't own sq.${idx}`)
    if (prop.houses > 0 || prop.hotel) throw new Error(`Remove buildings from sq.${idx} before trading`)
  }

  // Validate receiver has what they're offering in return
  const to = state.players.find(p => p.id === offer.toPlayerId)!
  if (to.cash < offer.request.cash) throw new Error('Counterpart has insufficient cash')
  for (const idx of offer.request.propertyIndices) {
    const prop = state.properties.find(p => p.squareIndex === idx)
    if (!prop || prop.ownerId !== offer.toPlayerId) throw new Error(`Counterpart doesn't own sq.${idx}`)
    if (prop.houses > 0 || prop.hotel) throw new Error(`Counterpart must remove buildings from sq.${idx}`)
  }

  const withTrade: GameState = { ...state, pendingTrade: offer }
  return addLog(withTrade, `${from.name} proposed a trade to ${to.name}.`)
}

export function acceptTrade(state: GameState, playerId: string): GameState {
  const trade = state.pendingTrade
  if (!trade) throw new Error('No pending trade')
  if (trade.toPlayerId !== playerId) throw new Error('Not your trade to accept')

  let next = state

  // Transfer cash
  if (trade.offer.cash > 0) {
    const from = next.players.find(p => p.id === trade.fromPlayerId)!
    const to = next.players.find(p => p.id === trade.toPlayerId)!
    next = updatePlayer(next, trade.fromPlayerId, { cash: from.cash - trade.offer.cash })
    next = updatePlayer(next, trade.toPlayerId, { cash: to.cash + trade.offer.cash })
  }
  if (trade.request.cash > 0) {
    const from = next.players.find(p => p.id === trade.toPlayerId)!
    const to = next.players.find(p => p.id === trade.fromPlayerId)!
    next = updatePlayer(next, trade.toPlayerId, { cash: from.cash - trade.request.cash })
    next = updatePlayer(next, trade.fromPlayerId, { cash: to.cash + trade.request.cash })
  }

  // Transfer properties (from → to)
  for (const idx of trade.offer.propertyIndices) {
    next = {
      ...next,
      properties: next.properties.map(p =>
        p.squareIndex === idx ? { ...p, ownerId: trade.toPlayerId } : p
      ),
    }
  }
  // Transfer properties (to → from)
  for (const idx of trade.request.propertyIndices) {
    next = {
      ...next,
      properties: next.properties.map(p =>
        p.squareIndex === idx ? { ...p, ownerId: trade.fromPlayerId } : p
      ),
    }
  }

  // Transfer GOOJF cards
  if (trade.offer.getOutOfJailFree > 0) {
    const from = next.players.find(p => p.id === trade.fromPlayerId)!
    const to = next.players.find(p => p.id === trade.toPlayerId)!
    next = updatePlayer(next, trade.fromPlayerId, { getOutOfJailFree: from.getOutOfJailFree - trade.offer.getOutOfJailFree })
    next = updatePlayer(next, trade.toPlayerId, { getOutOfJailFree: to.getOutOfJailFree + trade.offer.getOutOfJailFree })
  }
  if (trade.request.getOutOfJailFree > 0) {
    const from = next.players.find(p => p.id === trade.toPlayerId)!
    const to = next.players.find(p => p.id === trade.fromPlayerId)!
    next = updatePlayer(next, trade.toPlayerId, { getOutOfJailFree: from.getOutOfJailFree - trade.request.getOutOfJailFree })
    next = updatePlayer(next, trade.fromPlayerId, { getOutOfJailFree: to.getOutOfJailFree + trade.request.getOutOfJailFree })
  }

  const fromPlayer = state.players.find(p => p.id === trade.fromPlayerId)!
  const toPlayer = state.players.find(p => p.id === trade.toPlayerId)!
  next = { ...next, pendingTrade: null }
  next = addLog(next, `Trade accepted between ${fromPlayer.name} and ${toPlayer.name}.`)
  return next
}

export function declineTrade(state: GameState, playerId: string): GameState {
  if (!state.pendingTrade) throw new Error('No pending trade')
  const player = state.players.find(p => p.id === playerId)!
  const cleared: GameState = { ...state, pendingTrade: null }
  return addLog(cleared, `${player.name} declined the trade.`)
}
