import { gameEngine, createInitialState } from '@/lib/game-engine'
import { GameState } from '@/lib/game-engine/types'

function makeState(playerCount = 2): GameState {
  return createInitialState({
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      turnOrder: i,
    })),
  })
}

// Math.ceil(x * 6) === d  when x = d/6 - epsilon
function mockDice(d1: number, d2: number) {
  let call = 0
  jest.spyOn(Math, 'random').mockImplementation(() => {
    call++
    const d = call <= 1 ? d1 : d2
    return d / 6 - 0.0001
  })
}

afterEach(() => jest.restoreAllMocks())

// ---- Initial state ----

describe('createInitialState', () => {
  it('gives each player $1500', () => {
    const state = makeState()
    expect(state.players[0].cash).toBe(1500)
    expect(state.players[1].cash).toBe(1500)
  })

  it('starts all players at Go (square 0)', () => {
    const state = makeState()
    state.players.forEach(p => expect(p.position).toBe(0))
  })

  it('bank starts with 32 houses and 12 hotels', () => {
    const state = makeState()
    expect(state.bank.houses).toBe(32)
    expect(state.bank.hotels).toBe(12)
  })

  it('sets first player as current', () => {
    const state = makeState()
    expect(state.currentPlayerId).toBe('p1')
  })
})

// ---- Rolling ----

describe('ROLL_DICE', () => {
  it('rejects roll from wrong player', () => {
    const state = makeState()
    expect(() => gameEngine(state, { type: 'ROLL_DICE', playerId: 'p2' })).toThrow('Not your turn')
  })

  it('moves player by dice total (2+4=6, land on Oriental Ave)', () => {
    const state = makeState()
    mockDice(2, 4) // sq 6 = Oriental Ave, no card effect
    const next = gameEngine(state, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].position).toBe(6)
  })

  it('wraps around the board (38 + 5 = 3)', () => {
    const state = makeState()
    const withPos = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, position: 38 } : p) }
    mockDice(2, 3)
    const next = gameEngine(withPos, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].position).toBe(3)
  })

  it('collects $200 when passing Go (38 + 5 → sq 3, unowned)', () => {
    const state = makeState()
    const withPos = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, position: 38 } : p) }
    mockDice(2, 3)
    const next = gameEngine(withPos, { type: 'ROLL_DICE', playerId: 'p1' })
    // passes Go → +$200, lands on sq 3 (unowned) → phase buying, no rent
    expect(next.players[0].cash).toBe(1700)
  })

  it('goes to jail on 3 doubles', () => {
    let state = makeState()
    state = { ...state, doublesCount: 2 }
    mockDice(3, 3)
    const next = gameEngine(state, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].position).toBe(10)
    expect(next.players[0].jailTurns).toBe(3)
    expect(next.doublesCount).toBe(0)
  })

  it('goes to phase buying when landing on unowned property', () => {
    const state = makeState()
    mockDice(1, 2) // land on sq 3 (Baltic Ave)
    const next = gameEngine(state, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.phase).toBe('buying')
    expect(next.players[0].position).toBe(3)
  })
})

// ---- Jail ----

describe('Jail', () => {
  it('landing on Go To Jail sends to jail (pos 25 + 5 = 30)', () => {
    const state = makeState()
    const withPos = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, position: 25 } : p) }
    mockDice(2, 3)
    const next = gameEngine(withPos, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].position).toBe(10)
    expect(next.players[0].jailTurns).toBe(3)
  })

  it('PAY_JAIL_FINE costs $50 and releases from jail', () => {
    const state = makeState()
    const inJail = {
      ...state,
      phase: 'in_jail' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, jailTurns: 2 } : p),
    }
    const next = gameEngine(inJail, { type: 'PAY_JAIL_FINE', playerId: 'p1' })
    expect(next.players[0].cash).toBe(1450)
    expect(next.players[0].jailTurns).toBe(0)
    expect(next.phase).toBe('rolling')
  })

  it('USE_JAIL_CARD works when player has one', () => {
    const state = makeState()
    const inJail = {
      ...state,
      phase: 'in_jail' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, jailTurns: 2, getOutOfJailFree: 1 } : p),
    }
    const next = gameEngine(inJail, { type: 'USE_JAIL_CARD', playerId: 'p1' })
    expect(next.players[0].jailTurns).toBe(0)
    expect(next.players[0].getOutOfJailFree).toBe(0)
  })

  it('USE_JAIL_CARD fails without card', () => {
    const state = makeState()
    const inJail = {
      ...state,
      phase: 'in_jail' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, jailTurns: 2, getOutOfJailFree: 0 } : p),
    }
    expect(() => gameEngine(inJail, { type: 'USE_JAIL_CARD', playerId: 'p1' })).toThrow('No Get Out of Jail Free card')
  })

  it('rolling doubles while in jail releases player (pos 10 + 6 = 16)', () => {
    const state = makeState()
    const inJail = {
      ...state,
      phase: 'in_jail' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, jailTurns: 2, position: 10 } : p),
    }
    mockDice(3, 3)
    const next = gameEngine(inJail, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].jailTurns).toBe(0)
    expect(next.players[0].position).toBe(16)
  })

  it('stays in jail on non-doubles (decrements jailTurns)', () => {
    const state = makeState()
    const inJail = {
      ...state,
      phase: 'in_jail' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, jailTurns: 2, position: 10 } : p),
    }
    mockDice(2, 3) // non-doubles
    const next = gameEngine(inJail, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].jailTurns).toBe(1)
    expect(next.players[0].position).toBe(10) // didn't move
    expect(next.phase).toBe('end_turn')
  })
})

// ---- Buying ----

describe('BUY_PROPERTY', () => {
  function stateAtBuying(squareIndex: number): GameState {
    const state = makeState()
    return {
      ...state,
      phase: 'buying',
      players: state.players.map((p, i) => i === 0 ? { ...p, position: squareIndex } : p),
    }
  }

  it('deducts price and adds to properties', () => {
    const state = stateAtBuying(1) // Mediterranean $60
    const next = gameEngine(state, { type: 'BUY_PROPERTY', playerId: 'p1' })
    expect(next.players[0].cash).toBe(1440)
    expect(next.properties).toHaveLength(1)
    expect(next.properties[0]).toMatchObject({ squareIndex: 1, ownerId: 'p1', houses: 0 })
  })

  it('moves to end_turn phase', () => {
    const state = stateAtBuying(1)
    const next = gameEngine(state, { type: 'BUY_PROPERTY', playerId: 'p1' })
    expect(next.phase).toBe('end_turn')
  })

  it('fails if insufficient cash', () => {
    const state = stateAtBuying(39) // Boardwalk $400
    const broke = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, cash: 100 } : p) }
    expect(() => gameEngine(broke, { type: 'BUY_PROPERTY', playerId: 'p1' })).toThrow('Insufficient funds')
  })
})

// ---- Rent ----

describe('Rent', () => {
  // Player starts at sq 0, rolls 1+2=3, lands on sq 3 (Baltic Ave)
  it('charges rent when landing on owned property', () => {
    const state = makeState()
    const withProp = {
      ...state,
      properties: [{ squareIndex: 3, ownerId: 'p2', houses: 0, hotel: false, mortgaged: false }],
    }
    mockDice(1, 2)
    const next = gameEngine(withProp, { type: 'ROLL_DICE', playerId: 'p1' })
    // Baltic base rent = $4
    expect(next.players[0].cash).toBe(1496)
    expect(next.players[1].cash).toBe(1504)
  })

  it('doubles base rent when owner has full color group', () => {
    const state = makeState()
    const withMonopoly = {
      ...state,
      properties: [
        { squareIndex: 1, ownerId: 'p2', houses: 0, hotel: false, mortgaged: false },
        { squareIndex: 3, ownerId: 'p2', houses: 0, hotel: false, mortgaged: false },
      ],
    }
    mockDice(1, 2) // land on sq 3, both browns owned → rent $4 * 2 = $8
    const next = gameEngine(withMonopoly, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].cash).toBe(1492)
    expect(next.players[1].cash).toBe(1508)
  })

  it('does not charge rent on mortgaged property', () => {
    const state = makeState()
    const withMortgaged = {
      ...state,
      properties: [{ squareIndex: 3, ownerId: 'p2', houses: 0, hotel: false, mortgaged: true }],
    }
    mockDice(1, 2)
    const next = gameEngine(withMortgaged, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].cash).toBe(1500)
  })

  it('railroad rent scales with count owned (4 railroads = $200)', () => {
    const state = makeState()
    const fourRR = {
      ...state,
      properties: [5, 15, 25, 35].map(idx => ({
        squareIndex: idx, ownerId: 'p2', houses: 0, hotel: false, mortgaged: false,
      })),
    }
    mockDice(2, 3) // 0 + 5 = sq 5 (Reading Railroad)
    const next = gameEngine(fourRR, { type: 'ROLL_DICE', playerId: 'p1' })
    expect(next.players[0].cash).toBe(1300)
    expect(next.players[1].cash).toBe(1700)
  })

  it('utility rent is 4× dice when one owned', () => {
    const state = makeState()
    // Position player so they land on Electric Company (sq 12)
    const withPos = {
      ...state,
      players: state.players.map((p, i) => i === 0 ? { ...p, position: 9 } : p),
      properties: [{ squareIndex: 12, ownerId: 'p2', houses: 0, hotel: false, mortgaged: false }],
    }
    mockDice(1, 2) // 9 + 3 = sq 12
    const next = gameEngine(withPos, { type: 'ROLL_DICE', playerId: 'p1' })
    // dice total = 3, one utility → 3 * 4 = $12 rent
    expect(next.players[0].cash).toBe(1488)
    expect(next.players[1].cash).toBe(1512)
  })
})

// ---- Building ----

describe('BUILD', () => {
  function stateWithMonopoly(): GameState {
    const state = makeState()
    return {
      ...state,
      phase: 'end_turn',
      properties: [
        { squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false },
        { squareIndex: 3, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false },
      ],
    }
  }

  it('builds a house, deducts cost, reduces bank supply', () => {
    const state = stateWithMonopoly()
    const next = gameEngine(state, { type: 'BUILD', playerId: 'p1', squareIndex: 1, count: 1 })
    expect(next.properties.find(p => p.squareIndex === 1)!.houses).toBe(1)
    expect(next.players[0].cash).toBe(1450) // $50 house cost
    expect(next.bank.houses).toBe(31)
  })

  it('cannot build without full color group', () => {
    const state = makeState()
    const partial = {
      ...state,
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false }],
    }
    expect(() => gameEngine(partial, { type: 'BUILD', playerId: 'p1', squareIndex: 1, count: 1 }))
      .toThrow('full color group')
  })

  it('enforces even building — cannot build on sq 1 when sq 3 has fewer houses', () => {
    const state = stateWithMonopoly()
    // Build 1 on sq 1, then try to build on sq 1 again before sq 3
    const after1 = gameEngine(state, { type: 'BUILD', playerId: 'p1', squareIndex: 1, count: 1 })
    expect(() => gameEngine(after1, { type: 'BUILD', playerId: 'p1', squareIndex: 1, count: 1 }))
      .toThrow('evenly')
  })

  it('upgrades 4 houses to hotel when both properties have 4 houses', () => {
    const state = stateWithMonopoly()
    // Both properties must have 4 houses before hotel upgrade is valid
    const with4 = {
      ...state,
      properties: state.properties.map(p => ({ ...p, houses: 4 })),
    }
    const next = gameEngine(with4, { type: 'BUILD', playerId: 'p1', squareIndex: 1, count: 1 })
    const prop = next.properties.find(p => p.squareIndex === 1)!
    expect(prop.hotel).toBe(true)
    expect(prop.houses).toBe(0)
    expect(next.bank.hotels).toBe(11)
    expect(next.bank.houses).toBe(36) // 4 houses returned
  })
})

// ---- Mortgage ----

describe('MORTGAGE / UNMORTGAGE', () => {
  it('mortgages property and pays half price', () => {
    const state = makeState()
    const withProp = {
      ...state,
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false }],
    }
    const next = gameEngine(withProp, { type: 'MORTGAGE', playerId: 'p1', squareIndex: 1 })
    expect(next.players[0].cash).toBe(1530) // +$30 (half of $60)
    expect(next.properties[0].mortgaged).toBe(true)
  })

  it('unmortgages at 110% of mortgage value (floor)', () => {
    const state = makeState()
    const mortgaged = {
      ...state,
      players: state.players.map((p, i) => i === 0 ? { ...p, cash: 1530 } : p),
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: true }],
    }
    const next = gameEngine(mortgaged, { type: 'UNMORTGAGE', playerId: 'p1', squareIndex: 1 })
    expect(next.properties[0].mortgaged).toBe(false)
    // Cost = floor($30 * 1.1) = floor($33) = $33
    expect(next.players[0].cash).toBe(1497)
  })

  it('cannot mortgage if buildings present', () => {
    const state = makeState()
    const withHouse = {
      ...state,
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 1, hotel: false, mortgaged: false }],
    }
    expect(() => gameEngine(withHouse, { type: 'MORTGAGE', playerId: 'p1', squareIndex: 1 }))
      .toThrow('Sell all buildings')
  })
})

// ---- Trading ----

describe('Trading', () => {
  it('transfers properties and cash between players on accept', () => {
    const state = makeState()
    const withProps = {
      ...state,
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false }],
    }
    const proposed = gameEngine(withProps, {
      type: 'PROPOSE_TRADE',
      offer: {
        fromPlayerId: 'p1',
        toPlayerId: 'p2',
        offer: { cash: 100, propertyIndices: [1], getOutOfJailFree: 0 },
        request: { cash: 0, propertyIndices: [], getOutOfJailFree: 0 },
      },
    })
    expect(proposed.pendingTrade).not.toBeNull()

    const accepted = gameEngine(proposed, { type: 'ACCEPT_TRADE', playerId: 'p2' })
    expect(accepted.pendingTrade).toBeNull()
    expect(accepted.players[0].cash).toBe(1400)
    expect(accepted.players[1].cash).toBe(1600)
    expect(accepted.properties[0].ownerId).toBe('p2')
  })

  it('DECLINE_TRADE clears pending trade', () => {
    const state = makeState()
    const proposed = gameEngine(state, {
      type: 'PROPOSE_TRADE',
      offer: {
        fromPlayerId: 'p1',
        toPlayerId: 'p2',
        offer: { cash: 50, propertyIndices: [], getOutOfJailFree: 0 },
        request: { cash: 0, propertyIndices: [], getOutOfJailFree: 0 },
      },
    })
    const declined = gameEngine(proposed, { type: 'DECLINE_TRADE', playerId: 'p2' })
    expect(declined.pendingTrade).toBeNull()
  })
})

// ---- Bankruptcy ----

describe('Bankruptcy', () => {
  it('eliminates player and transfers assets to creditor', () => {
    const state = makeState()
    const broke = {
      ...state,
      players: state.players.map((p, i) => i === 0 ? { ...p, cash: 0 } : p),
      properties: [{ squareIndex: 1, ownerId: 'p1', houses: 0, hotel: false, mortgaged: false }],
    }
    const next = gameEngine(broke, { type: 'DECLARE_BANKRUPTCY', playerId: 'p1', creditorId: 'p2' })
    expect(next.players[0].bankrupt).toBe(true)
    expect(next.players[0].cash).toBe(0)
    expect(next.properties[0].ownerId).toBe('p2')
  })

  it('sets winner when only one player remains', () => {
    const state = makeState(2)
    const next = gameEngine(state, { type: 'DECLARE_BANKRUPTCY', playerId: 'p1', creditorId: null })
    expect(next.winner).toBe('p2')
    expect(next.phase).toBe('game_over')
  })

  it('no further actions possible after game_over', () => {
    const state = makeState(2)
    const over = gameEngine(state, { type: 'DECLARE_BANKRUPTCY', playerId: 'p1', creditorId: null })
    const same = gameEngine(over, { type: 'END_TURN', playerId: 'p2' })
    expect(same).toBe(over) // identity: state unchanged
  })
})

// ---- Turn flow ----

describe('END_TURN', () => {
  it('advances to next player', () => {
    const state = makeState()
    const atEnd = { ...state, phase: 'end_turn' as const }
    const next = gameEngine(atEnd, { type: 'END_TURN', playerId: 'p1' })
    expect(next.currentPlayerId).toBe('p2')
    expect(next.phase).toBe('rolling')
  })

  it('wraps around to first player', () => {
    const state = makeState(2)
    const p2Turn = { ...state, currentPlayerId: 'p2', phase: 'end_turn' as const }
    const next = gameEngine(p2Turn, { type: 'END_TURN', playerId: 'p2' })
    expect(next.currentPlayerId).toBe('p1')
  })

  it('skips bankrupt players', () => {
    const state = makeState(3)
    const withBankrupt = {
      ...state,
      currentPlayerId: 'p1',
      phase: 'end_turn' as const,
      players: state.players.map(p => p.id === 'p2' ? { ...p, bankrupt: true } : p),
    }
    const next = gameEngine(withBankrupt, { type: 'END_TURN', playerId: 'p1' })
    expect(next.currentPlayerId).toBe('p3')
  })
})

// ---- Auction ----

describe('Auction', () => {
  it('DECLINE_BUY starts auction', () => {
    const state = makeState()
    const buying = {
      ...state,
      phase: 'buying' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, position: 1 } : p),
    }
    const next = gameEngine(buying, { type: 'DECLINE_BUY', playerId: 'p1' })
    expect(next.phase).toBe('auctioning')
    expect(next.auction).not.toBeNull()
    expect(next.auction!.squareIndex).toBe(1)
  })

  it('BID places bid and advances current bidder', () => {
    const state = makeState()
    const buying = {
      ...state,
      phase: 'buying' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, position: 1 } : p),
    }
    const auctioning = gameEngine(buying, { type: 'DECLINE_BUY', playerId: 'p1' })
    const bid = gameEngine(auctioning, { type: 'BID', playerId: 'p1', amount: 10 })
    expect(bid.auction!.highestBid).toBe(10)
    expect(bid.auction!.highestBidderId).toBe('p1')
    expect(bid.auction!.currentBidderId).toBe('p2')
  })

  it('PASS_BID by all players ends auction with no winner', () => {
    const state = makeState(2)
    const buying = {
      ...state,
      phase: 'buying' as const,
      players: state.players.map((p, i) => i === 0 ? { ...p, position: 1 } : p),
    }
    const auctioning = gameEngine(buying, { type: 'DECLINE_BUY', playerId: 'p1' })
    const p1pass = gameEngine(auctioning, { type: 'PASS_BID', playerId: 'p1' })
    const p2pass = gameEngine(p1pass, { type: 'PASS_BID', playerId: 'p2' })
    expect(p2pass.auction).toBeNull()
    expect(p2pass.phase).toBe('end_turn')
    expect(p2pass.properties).toHaveLength(0)
  })
})
