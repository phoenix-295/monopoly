export type SquareType =
  | 'go' | 'jail' | 'free-parking' | 'go-to-jail'
  | 'property' | 'railroad' | 'utility'
  | 'income-tax' | 'luxury-tax' | 'chance' | 'community-chest'

export interface BoardSquare {
  index: number
  name: string
  type: SquareType
  color?: string
  colorGroup?: string
  price?: number
  rent?: [number, number, number, number, number, number]
  housePrice?: number
  mortgage?: number
  taxAmount?: number
  icon?: string
}

export const BOARD: BoardSquare[] = [
  { index: 0,  name: 'GO',                      type: 'go' },
  { index: 1,  name: 'Mediterranean Avenue',    type: 'property',       color: '#92400E', colorGroup: 'brown',     price: 60,  rent: [2,  10,  30,  90,  160,  250],  housePrice: 50,  mortgage: 30  },
  { index: 2,  name: 'Community Chest',         type: 'community-chest', icon: '📦' },
  { index: 3,  name: 'Baltic Avenue',           type: 'property',       color: '#92400E', colorGroup: 'brown',     price: 60,  rent: [4,  20,  60,  180, 320,  450],  housePrice: 50,  mortgage: 30  },
  { index: 4,  name: 'Income Tax',              type: 'income-tax',     taxAmount: 200,   icon: '💸' },
  { index: 5,  name: 'Reading Railroad',        type: 'railroad',       price: 200, mortgage: 100, icon: '🚂' },
  { index: 6,  name: 'Oriental Avenue',         type: 'property',       color: '#38BDF8', colorGroup: 'light-blue', price: 100, rent: [6,  30,  90,  270, 400,  550],  housePrice: 50,  mortgage: 50  },
  { index: 7,  name: 'Chance',                  type: 'chance',         icon: '?' },
  { index: 8,  name: 'Vermont Avenue',          type: 'property',       color: '#38BDF8', colorGroup: 'light-blue', price: 100, rent: [6,  30,  90,  270, 400,  550],  housePrice: 50,  mortgage: 50  },
  { index: 9,  name: 'Connecticut Avenue',      type: 'property',       color: '#38BDF8', colorGroup: 'light-blue', price: 120, rent: [8,  40,  100, 300, 450,  600],  housePrice: 50,  mortgage: 60  },
  { index: 10, name: 'Just Visiting / Jail',    type: 'jail' },
  { index: 11, name: 'St. Charles Place',       type: 'property',       color: '#EC4899', colorGroup: 'pink',      price: 140, rent: [10, 50,  150, 450, 625,  750],  housePrice: 100, mortgage: 70  },
  { index: 12, name: 'Electric Company',        type: 'utility',        price: 150, mortgage: 75,  icon: '⚡' },
  { index: 13, name: 'States Avenue',           type: 'property',       color: '#EC4899', colorGroup: 'pink',      price: 140, rent: [10, 50,  150, 450, 625,  750],  housePrice: 100, mortgage: 70  },
  { index: 14, name: 'Virginia Avenue',         type: 'property',       color: '#EC4899', colorGroup: 'pink',      price: 160, rent: [12, 60,  180, 500, 700,  900],  housePrice: 100, mortgage: 80  },
  { index: 15, name: 'Pennsylvania Railroad',   type: 'railroad',       price: 200, mortgage: 100, icon: '🚂' },
  { index: 16, name: 'St. James Place',         type: 'property',       color: '#F97316', colorGroup: 'orange',    price: 180, rent: [14, 70,  200, 550, 750,  950],  housePrice: 100, mortgage: 90  },
  { index: 17, name: 'Community Chest',         type: 'community-chest', icon: '📦' },
  { index: 18, name: 'Tennessee Avenue',        type: 'property',       color: '#F97316', colorGroup: 'orange',    price: 180, rent: [14, 70,  200, 550, 750,  950],  housePrice: 100, mortgage: 90  },
  { index: 19, name: 'New York Avenue',         type: 'property',       color: '#F97316', colorGroup: 'orange',    price: 200, rent: [16, 80,  220, 600, 800,  1000], housePrice: 100, mortgage: 100 },
  { index: 20, name: 'Free Parking',            type: 'free-parking' },
  { index: 21, name: 'Kentucky Avenue',         type: 'property',       color: '#EF4444', colorGroup: 'red',       price: 220, rent: [18, 90,  250, 700, 875,  1050], housePrice: 150, mortgage: 110 },
  { index: 22, name: 'Chance',                  type: 'chance',         icon: '?' },
  { index: 23, name: 'Indiana Avenue',          type: 'property',       color: '#EF4444', colorGroup: 'red',       price: 220, rent: [18, 90,  250, 700, 875,  1050], housePrice: 150, mortgage: 110 },
  { index: 24, name: 'Illinois Avenue',         type: 'property',       color: '#EF4444', colorGroup: 'red',       price: 240, rent: [20, 100, 300, 750, 925,  1100], housePrice: 150, mortgage: 120 },
  { index: 25, name: 'B&O Railroad',            type: 'railroad',       price: 200, mortgage: 100, icon: '🚂' },
  { index: 26, name: 'Atlantic Avenue',         type: 'property',       color: '#EAB308', colorGroup: 'yellow',    price: 260, rent: [22, 110, 330, 800, 975,  1150], housePrice: 150, mortgage: 130 },
  { index: 27, name: 'Ventnor Avenue',          type: 'property',       color: '#EAB308', colorGroup: 'yellow',    price: 260, rent: [22, 110, 330, 800, 975,  1150], housePrice: 150, mortgage: 130 },
  { index: 28, name: 'Water Works',             type: 'utility',        price: 150, mortgage: 75,  icon: '💧' },
  { index: 29, name: 'Marvin Gardens',          type: 'property',       color: '#EAB308', colorGroup: 'yellow',    price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150, mortgage: 140 },
  { index: 30, name: 'Go To Jail',              type: 'go-to-jail' },
  { index: 31, name: 'Pacific Avenue',          type: 'property',       color: '#22C55E', colorGroup: 'green',     price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, mortgage: 150 },
  { index: 32, name: 'North Carolina Avenue',   type: 'property',       color: '#22C55E', colorGroup: 'green',     price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, mortgage: 150 },
  { index: 33, name: 'Community Chest',         type: 'community-chest', icon: '📦' },
  { index: 34, name: 'Pennsylvania Avenue',     type: 'property',       color: '#22C55E', colorGroup: 'green',     price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200, mortgage: 160 },
  { index: 35, name: 'Short Line Railroad',     type: 'railroad',       price: 200, mortgage: 100, icon: '🚂' },
  { index: 36, name: 'Chance',                  type: 'chance',         icon: '?' },
  { index: 37, name: 'Park Place',              type: 'property',       color: '#3B82F6', colorGroup: 'dark-blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200, mortgage: 175 },
  { index: 38, name: 'Luxury Tax',              type: 'luxury-tax',     taxAmount: 100,   icon: '💎' },
  { index: 39, name: 'Boardwalk',               type: 'property',       color: '#3B82F6', colorGroup: 'dark-blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], housePrice: 200, mortgage: 200 },
]

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'corner'

interface SquarePosition {
  col: number
  row: number
  side: Side
  rotation: number
}

export const SQUARE_POSITIONS: SquarePosition[] = [
  // 0: Go (corner, bottom-right)
  { col: 11, row: 11, side: 'corner', rotation: 0 },
  // 1-9: Bottom row (right to left)
  { col: 10, row: 11, side: 'bottom', rotation: 180 },
  { col: 9,  row: 11, side: 'bottom', rotation: 180 },
  { col: 8,  row: 11, side: 'bottom', rotation: 180 },
  { col: 7,  row: 11, side: 'bottom', rotation: 180 },
  { col: 6,  row: 11, side: 'bottom', rotation: 180 },
  { col: 5,  row: 11, side: 'bottom', rotation: 180 },
  { col: 4,  row: 11, side: 'bottom', rotation: 180 },
  { col: 3,  row: 11, side: 'bottom', rotation: 180 },
  { col: 2,  row: 11, side: 'bottom', rotation: 180 },
  // 10: Jail (corner, bottom-left)
  { col: 1,  row: 11, side: 'corner', rotation: 0 },
  // 11-19: Left column (bottom to top)
  { col: 1,  row: 10, side: 'left', rotation: 90 },
  { col: 1,  row: 9,  side: 'left', rotation: 90 },
  { col: 1,  row: 8,  side: 'left', rotation: 90 },
  { col: 1,  row: 7,  side: 'left', rotation: 90 },
  { col: 1,  row: 6,  side: 'left', rotation: 90 },
  { col: 1,  row: 5,  side: 'left', rotation: 90 },
  { col: 1,  row: 4,  side: 'left', rotation: 90 },
  { col: 1,  row: 3,  side: 'left', rotation: 90 },
  { col: 1,  row: 2,  side: 'left', rotation: 90 },
  // 20: Free Parking (corner, top-left)
  { col: 1,  row: 1,  side: 'corner', rotation: 0 },
  // 21-29: Top row (left to right)
  { col: 2,  row: 1,  side: 'top', rotation: 0 },
  { col: 3,  row: 1,  side: 'top', rotation: 0 },
  { col: 4,  row: 1,  side: 'top', rotation: 0 },
  { col: 5,  row: 1,  side: 'top', rotation: 0 },
  { col: 6,  row: 1,  side: 'top', rotation: 0 },
  { col: 7,  row: 1,  side: 'top', rotation: 0 },
  { col: 8,  row: 1,  side: 'top', rotation: 0 },
  { col: 9,  row: 1,  side: 'top', rotation: 0 },
  { col: 10, row: 1,  side: 'top', rotation: 0 },
  // 30: Go To Jail (corner, top-right)
  { col: 11, row: 1,  side: 'corner', rotation: 0 },
  // 31-39: Right column (top to bottom)
  { col: 11, row: 2,  side: 'right', rotation: -90 },
  { col: 11, row: 3,  side: 'right', rotation: -90 },
  { col: 11, row: 4,  side: 'right', rotation: -90 },
  { col: 11, row: 5,  side: 'right', rotation: -90 },
  { col: 11, row: 6,  side: 'right', rotation: -90 },
  { col: 11, row: 7,  side: 'right', rotation: -90 },
  { col: 11, row: 8,  side: 'right', rotation: -90 },
  { col: 11, row: 9,  side: 'right', rotation: -90 },
  { col: 11, row: 10, side: 'right', rotation: -90 },
]
