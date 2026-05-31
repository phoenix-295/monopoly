import { GameState, AuctionState } from './types'
import { PROPERTY_PRICE } from './board'
import { addLog, nextPlayer } from './state'
import { transferCash } from './finance'

export function startAuction(state: GameState, squareIndex: number): GameState {
  const active = state.players.filter(p => !p.bankrupt)
  const auction: AuctionState = {
    squareIndex,
    bids: {},
    currentBidderId: state.currentPlayerId,
    highestBid: 0,
    highestBidderId: null,
    passedPlayerIds: [],
  }
  const withAuction: GameState = { ...state, auction, phase: 'auctioning' as const }
  return addLog(withAuction, `Auction started for square ${squareIndex}. Starting at $1.`)
}

export function placeBid(state: GameState, playerId: string, amount: number): GameState {
  if (!state.auction) throw new Error('No active auction')
  if (state.auction.currentBidderId !== playerId) throw new Error('Not your turn to bid')

  const player = state.players.find(p => p.id === playerId)!
  if (amount <= state.auction.highestBid) throw new Error(`Bid must exceed current high of $${state.auction.highestBid}`)
  if (amount > player.cash) throw new Error('Insufficient funds')

  const auction: AuctionState = {
    ...state.auction,
    bids: { ...state.auction.bids, [playerId]: amount },
    highestBid: amount,
    highestBidderId: playerId,
    currentBidderId: advanceBidder(state, playerId),
  }
  const withBid: GameState = { ...state, auction }
  return addLog(withBid, `${player.name} bid $${amount}.`)
}

export function passBid(state: GameState, playerId: string): GameState {
  if (!state.auction) throw new Error('No active auction')
  if (state.auction.currentBidderId !== playerId) throw new Error('Not your turn to bid')

  const passed = [...state.auction.passedPlayerIds, playerId]
  const active = state.players.filter(p => !p.bankrupt && !passed.includes(p.id))

  if (active.length === 0 || (active.length === 1 && state.auction.highestBidderId)) {
    // Auction ends
    return resolveAuction({ ...state, auction: { ...state.auction, passedPlayerIds: passed } })
  }

  const auction: AuctionState = {
    ...state.auction,
    passedPlayerIds: passed,
    currentBidderId: advanceBidder(state, playerId, passed),
  }
  const player = state.players.find(p => p.id === playerId)!
  const withPass: GameState = { ...state, auction }
  return addLog(withPass, `${player.name} passed.`)
}

function advanceBidder(state: GameState, currentId: string, passed?: string[]): string {
  const skip = passed ?? state.auction?.passedPlayerIds ?? []
  const active = state.players.filter(p => !p.bankrupt && !skip.includes(p.id))
  const idx = active.findIndex(p => p.id === currentId)
  return active[(idx + 1) % active.length].id
}

function resolveAuction(state: GameState): GameState {
  const auction = state.auction!
  let next: GameState

  if (!auction.highestBidderId) {
    // No bids — property stays with bank
    next = { ...state, auction: null, phase: 'end_turn' }
    next = addLog(next, `No bids — sq.${auction.squareIndex} returned to bank.`)
  } else {
    const winner = state.players.find(p => p.id === auction.highestBidderId)!
    next = transferCash(state, winner.id, null, auction.highestBid)
    next = {
      ...next,
      properties: [
        ...next.properties,
        { squareIndex: auction.squareIndex, ownerId: winner.id, houses: 0, hotel: false, mortgaged: false },
      ],
      auction: null,
      phase: 'end_turn',
    }
    next = addLog(next, `${winner.name} won the auction for sq.${auction.squareIndex} at $${auction.highestBid}.`)
  }

  return next
}
