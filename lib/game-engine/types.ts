export type TurnPhase =
  | 'waiting'
  | 'rolling'
  | 'moving'
  | 'landing'
  | 'buying'
  | 'auctioning'
  | 'trading'
  | 'in_jail'
  | 'bankrupt'
  | 'end_turn'
  | 'game_over'

export type PropertyGroup =
  | 'brown' | 'light-blue' | 'pink' | 'orange'
  | 'red' | 'yellow' | 'green' | 'dark-blue'

export interface OwnedProperty {
  squareIndex: number
  ownerId: string
  houses: number        // 0–4
  hotel: boolean
  mortgaged: boolean
}

export interface Player {
  id: string
  name: string
  cash: number
  position: number      // 0–39
  jailTurns: number     // 0 = not in jail, 1–3 = turns remaining
  getOutOfJailFree: number
  bankrupt: boolean
  turnOrder: number
}

export interface AuctionState {
  squareIndex: number
  bids: Record<string, number>  // playerId → current bid
  currentBidderId: string
  highestBid: number
  highestBidderId: string | null
  passedPlayerIds: string[]
}

export interface TradeOffer {
  fromPlayerId: string
  toPlayerId: string
  offer: {
    cash: number
    propertyIndices: number[]
    getOutOfJailFree: number
  }
  request: {
    cash: number
    propertyIndices: number[]
    getOutOfJailFree: number
  }
}

export interface Card {
  id: string
  text: string
  action: CardAction
}

export type CardAction =
  | { type: 'move_to'; squareIndex: number; collectGo: boolean }
  | { type: 'move_by'; steps: number }
  | { type: 'move_to_nearest'; squareType: 'railroad' | 'utility' }
  | { type: 'pay_bank'; amount: number }
  | { type: 'collect_bank'; amount: number }
  | { type: 'collect_all_players'; amount: number }
  | { type: 'pay_all_players'; amount: number }
  | { type: 'go_to_jail' }
  | { type: 'get_out_of_jail_free' }
  | { type: 'pay_repairs'; perHouse: number; perHotel: number }

export interface GameState {
  players: Player[]
  properties: OwnedProperty[]
  currentPlayerId: string
  phase: TurnPhase
  lastDice: [number, number]
  doublesCount: number
  bank: { houses: number; hotels: number }
  deckChance: Card[]
  deckCommunity: Card[]
  auction: AuctionState | null
  pendingTrade: TradeOffer | null
  winner: string | null
  freeParkingPot: number   // optional house rule, always tracked
  log: string[]
}

// ---- Actions ----

export type GameAction =
  | { type: 'ROLL_DICE'; playerId: string }
  | { type: 'BUY_PROPERTY'; playerId: string }
  | { type: 'DECLINE_BUY'; playerId: string }
  | { type: 'BID'; playerId: string; amount: number }
  | { type: 'PASS_BID'; playerId: string }
  | { type: 'BUILD'; playerId: string; squareIndex: number; count: number }
  | { type: 'SELL_HOUSES'; playerId: string; squareIndex: number; count: number }
  | { type: 'MORTGAGE'; playerId: string; squareIndex: number }
  | { type: 'UNMORTGAGE'; playerId: string; squareIndex: number }
  | { type: 'PAY_JAIL_FINE'; playerId: string }
  | { type: 'USE_JAIL_CARD'; playerId: string }
  | { type: 'PROPOSE_TRADE'; offer: TradeOffer }
  | { type: 'ACCEPT_TRADE'; playerId: string }
  | { type: 'DECLINE_TRADE'; playerId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'DECLARE_BANKRUPTCY'; playerId: string; creditorId: string | null }
