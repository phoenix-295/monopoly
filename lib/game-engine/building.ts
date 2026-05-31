import { GameState } from './types'
import { ownsFullGroup, getProperty } from './rent'
import { COLOR_GROUP, GROUP_MEMBERS, HOUSE_PRICE, isProperty } from './board'
import { addLog } from './state'
import { transferCash } from './finance'

export function canBuild(state: GameState, playerId: string, squareIndex: number): string | null {
  if (!isProperty(squareIndex)) return 'Not a buildable property'
  const group = COLOR_GROUP[squareIndex]
  if (!group) return 'No color group'
  if (!ownsFullGroup(state, playerId, group)) return 'Must own the full color group'

  const prop = getProperty(state, squareIndex)
  if (!prop || prop.ownerId !== playerId) return 'You do not own this property'
  if (prop.mortgaged) return 'Property is mortgaged'
  if (prop.hotel) return 'Already has a hotel'
  if (prop.houses < 4 && state.bank.houses === 0) return 'No houses available in bank'
  if (prop.houses === 4 && state.bank.hotels === 0) return 'No hotels available in bank'

  // Enforce even building: can't build if another property in group has fewer houses
  const members = GROUP_MEMBERS[group] ?? []
  for (const idx of members) {
    const other = getProperty(state, idx)
    const otherHouses = other?.hotel ? 5 : (other?.houses ?? 0)
    const thisHouses = prop.hotel ? 5 : prop.houses
    if (otherHouses < thisHouses) return 'Must build evenly — another property in the group has fewer buildings'
  }

  return null
}

export function buildHouse(state: GameState, playerId: string, squareIndex: number, count: number): GameState {
  let next = state
  for (let i = 0; i < count; i++) {
    const err = canBuild(next, playerId, squareIndex)
    if (err) throw new Error(err)

    const prop = getProperty(next, squareIndex)!
    const price = HOUSE_PRICE[squareIndex]

    if (prop.houses === 4) {
      // Upgrade to hotel
      if (next.bank.hotels === 0) throw new Error('No hotels in bank')
      next = {
        ...next,
        properties: next.properties.map(p =>
          p.squareIndex === squareIndex ? { ...p, houses: 0, hotel: true } : p
        ),
        bank: { ...next.bank, houses: next.bank.houses + 4, hotels: next.bank.hotels - 1 },
      }
      next = transferCash(next, playerId, null, price)
      next = addLog(next, `${next.players.find(p => p.id === playerId)!.name} built a hotel on square ${squareIndex}.`)
    } else {
      next = {
        ...next,
        properties: next.properties.map(p =>
          p.squareIndex === squareIndex ? { ...p, houses: p.houses + 1 } : p
        ),
        bank: { ...next.bank, houses: next.bank.houses - 1 },
      }
      next = transferCash(next, playerId, null, price)
      next = addLog(next, `${next.players.find(p => p.id === playerId)!.name} built a house on square ${squareIndex}.`)
    }
  }
  return next
}

export function sellHouses(state: GameState, playerId: string, squareIndex: number, count: number): GameState {
  let next = state
  for (let i = 0; i < count; i++) {
    const prop = getProperty(next, squareIndex)
    if (!prop || prop.ownerId !== playerId) throw new Error('You do not own this property')

    const price = HOUSE_PRICE[squareIndex]
    const halfPrice = Math.floor(price / 2)

    if (prop.hotel) {
      // Sell hotel → 4 houses (if available)
      if (next.bank.houses < 4) throw new Error('Not enough houses in bank to downgrade hotel')
      next = {
        ...next,
        properties: next.properties.map(p =>
          p.squareIndex === squareIndex ? { ...p, houses: 4, hotel: false } : p
        ),
        bank: { ...next.bank, houses: next.bank.houses - 4, hotels: next.bank.hotels + 1 },
      }
      next = transferCash(next, null, playerId, halfPrice)
    } else if (prop.houses > 0) {
      next = {
        ...next,
        properties: next.properties.map(p =>
          p.squareIndex === squareIndex ? { ...p, houses: p.houses - 1 } : p
        ),
        bank: { ...next.bank, houses: next.bank.houses + 1 },
      }
      next = transferCash(next, null, playerId, halfPrice)
    } else {
      throw new Error('No buildings to sell')
    }
  }
  return next
}
