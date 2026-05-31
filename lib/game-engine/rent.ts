import { GameState, OwnedProperty } from './types'
import {
  PROPERTY_RENT, GROUP_MEMBERS, COLOR_GROUP,
  RAILROAD_INDICES, UTILITY_INDICES,
  isProperty, isRailroad, isUtility,
} from './board'

export function calculateRent(
  state: GameState,
  squareIndex: number,
  prop: OwnedProperty,
  diceRoll: number,
): number {
  if (prop.mortgaged) return 0

  if (isProperty(squareIndex)) {
    const rentTable = PROPERTY_RENT[squareIndex]
    if (!rentTable) return 0

    if (prop.hotel) return rentTable[5]
    if (prop.houses > 0) return rentTable[prop.houses]

    // Base rent doubles if owner has monopoly (full color group, no buildings)
    const group = COLOR_GROUP[squareIndex]
    if (group && ownsFullGroup(state, prop.ownerId, group)) {
      return rentTable[0] * 2
    }
    return rentTable[0]
  }

  if (isRailroad(squareIndex)) {
    const owned = state.properties.filter(
      p => RAILROAD_INDICES.includes(p.squareIndex) && p.ownerId === prop.ownerId && !p.mortgaged
    )
    const count = owned.length
    return 25 * Math.pow(2, count - 1)
  }

  if (isUtility(squareIndex)) {
    const ownedUtilities = state.properties.filter(
      p => UTILITY_INDICES.includes(p.squareIndex) && p.ownerId === prop.ownerId && !p.mortgaged
    )
    const multiplier = ownedUtilities.length >= 2 ? 10 : 4
    return diceRoll * multiplier
  }

  return 0
}

export function ownsFullGroup(state: GameState, playerId: string, group: string): boolean {
  const members = GROUP_MEMBERS[group] ?? []
  return members.every(idx =>
    state.properties.some(p => p.squareIndex === idx && p.ownerId === playerId && !p.mortgaged)
  )
}

export function getProperty(state: GameState, squareIndex: number): OwnedProperty | undefined {
  return state.properties.find(p => p.squareIndex === squareIndex)
}
