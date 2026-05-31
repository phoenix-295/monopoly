// Board constants and helpers — no import from UI layer

export const RAILROAD_INDICES = [5, 15, 25, 35]
export const UTILITY_INDICES = [12, 28]
export const GO_INDEX = 0
export const JAIL_INDEX = 10
export const FREE_PARKING_INDEX = 20
export const GO_TO_JAIL_INDEX = 30
export const INCOME_TAX_INDEX = 4
export const LUXURY_TAX_INDEX = 38
export const INCOME_TAX_AMOUNT = 200
export const LUXURY_TAX_AMOUNT = 100
export const CHANCE_INDICES = [7, 22, 36]
export const COMMUNITY_CHEST_INDICES = [2, 17, 33]

// Rent for properties indexed by square
// [base, 1h, 2h, 3h, 4h, hotel]
export const PROPERTY_RENT: Record<number, [number, number, number, number, number, number]> = {
  1:  [2,  10,  30,  90,  160,  250],
  3:  [4,  20,  60,  180, 320,  450],
  6:  [6,  30,  90,  270, 400,  550],
  8:  [6,  30,  90,  270, 400,  550],
  9:  [8,  40,  100, 300, 450,  600],
  11: [10, 50,  150, 450, 625,  750],
  13: [10, 50,  150, 450, 625,  750],
  14: [12, 60,  180, 500, 700,  900],
  16: [14, 70,  200, 550, 750,  950],
  18: [14, 70,  200, 550, 750,  950],
  19: [16, 80,  220, 600, 800,  1000],
  21: [18, 90,  250, 700, 875,  1050],
  23: [18, 90,  250, 700, 875,  1050],
  24: [20, 100, 300, 750, 925,  1100],
  26: [22, 110, 330, 800, 975,  1150],
  27: [22, 110, 330, 800, 975,  1150],
  29: [24, 120, 360, 850, 1025, 1200],
  31: [26, 130, 390, 900, 1100, 1275],
  32: [26, 130, 390, 900, 1100, 1275],
  34: [28, 150, 450, 1000, 1200, 1400],
  37: [35, 175, 500, 1100, 1300, 1500],
  39: [50, 200, 600, 1400, 1700, 2000],
}

export const PROPERTY_PRICE: Record<number, number> = {
  1: 60, 3: 60, 6: 100, 8: 100, 9: 120, 11: 140, 13: 140, 14: 160,
  16: 180, 18: 180, 19: 200, 21: 220, 23: 220, 24: 240, 26: 260,
  27: 260, 29: 280, 31: 300, 32: 300, 34: 320, 37: 350, 39: 400,
  5: 200, 15: 200, 25: 200, 35: 200,   // railroads
  12: 150, 28: 150,                     // utilities
}

export const HOUSE_PRICE: Record<number, number> = {
  1: 50, 3: 50, 6: 50, 8: 50, 9: 50,
  11: 100, 13: 100, 14: 100, 16: 100, 18: 100, 19: 100,
  21: 150, 23: 150, 24: 150, 26: 150, 27: 150, 29: 150,
  31: 200, 32: 200, 34: 200, 37: 200, 39: 200,
}

export const COLOR_GROUP: Record<number, string> = {
  1: 'brown', 3: 'brown',
  6: 'light-blue', 8: 'light-blue', 9: 'light-blue',
  11: 'pink', 13: 'pink', 14: 'pink',
  16: 'orange', 18: 'orange', 19: 'orange',
  21: 'red', 23: 'red', 24: 'red',
  26: 'yellow', 27: 'yellow', 29: 'yellow',
  31: 'green', 32: 'green', 34: 'green',
  37: 'dark-blue', 39: 'dark-blue',
}

export const GROUP_MEMBERS: Record<string, number[]> = {
  'brown':      [1, 3],
  'light-blue': [6, 8, 9],
  'pink':       [11, 13, 14],
  'orange':     [16, 18, 19],
  'red':        [21, 23, 24],
  'yellow':     [26, 27, 29],
  'green':      [31, 32, 34],
  'dark-blue':  [37, 39],
}

export function isProperty(idx: number): boolean {
  return idx in PROPERTY_RENT
}

export function isRailroad(idx: number): boolean {
  return RAILROAD_INDICES.includes(idx)
}

export function isUtility(idx: number): boolean {
  return UTILITY_INDICES.includes(idx)
}

export function isPurchasable(idx: number): boolean {
  return isProperty(idx) || isRailroad(idx) || isUtility(idx)
}

export function nearestRailroad(position: number): number {
  // Find next railroad going forward
  const ahead = RAILROAD_INDICES.filter(r => r > position)
  return ahead.length > 0 ? ahead[0] : RAILROAD_INDICES[0]
}

export function nearestUtility(position: number): number {
  const ahead = UTILITY_INDICES.filter(u => u > position)
  return ahead.length > 0 ? ahead[0] : UTILITY_INDICES[0]
}
